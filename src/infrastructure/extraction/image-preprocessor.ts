/**
 * Image Preprocessor for OCR
 *
 * Prepares images for optimal OCR accuracy by:
 * - Converting to grayscale
 * - Enhancing contrast
 * - Removing noise
 * - Deskewing
 * - Resizing to optimal DPI
 */

export interface PreprocessOptions {
  targetWidth?: number;
  targetHeight?: number;
  enhanceContrast?: boolean;
  denoise?: boolean;
  deskew?: boolean;
  threshold?: boolean;
}

const DEFAULT_OPTIONS: PreprocessOptions = {
  targetWidth: 1800, // Optimal width for OCR (roughly 300 DPI for A4)
  enhanceContrast: false, // Disabled by default - can hurt some images
  denoise: false, // Disabled by default - can remove thin text
  deskew: false, // Disabled by default as it's computationally expensive
  threshold: false, // Only use for very poor quality images
};

/**
 * Preprocess an image for optimal OCR accuracy
 */
export async function preprocessImage(
  imageSource: string | File | Blob,
  options: PreprocessOptions = {},
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Load image
  const img = await loadImage(imageSource);

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Calculate optimal dimensions while maintaining aspect ratio
  const { width, height } = calculateOptimalDimensions(
    img.width,
    img.height,
    opts.targetWidth,
    opts.targetHeight,
  );

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  // Fill white background (important for documents)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Use high quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Only apply heavy processing if explicitly requested
  // Default is just resize with high quality
  if (opts.threshold || (opts.enhanceContrast && opts.denoise)) {
    // Get image data for processing
    let imageData = ctx.getImageData(0, 0, width, height);

    // Apply preprocessing steps - be conservative to avoid destroying text
    if (opts.enhanceContrast) {
      imageData = enhanceContrast(imageData);
    }

    if (opts.denoise && opts.threshold) {
      // Only denoise if thresholding is also enabled
      imageData = denoise(imageData);
    }

    if (opts.threshold) {
      imageData = applyThreshold(imageData, 128);
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);
  }

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/png",
      1.0, // Maximum quality
    );
  });
}

/**
 * Load an image from various sources
 */
function loadImage(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));

    if (source instanceof File || source instanceof Blob) {
      const url = URL.createObjectURL(source);
      img.src = url;
      // Clean up object URL after loading
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
    } else {
      img.src = source;
    }
  });
}

/**
 * Calculate optimal dimensions for OCR
 * Target: ~300 DPI for typical documents
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
): { width: number; height: number } {
  // If image is very small, scale up
  if (originalWidth < 800 || originalHeight < 800) {
    const scale = Math.max(800 / originalWidth, 800 / originalHeight);
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
    };
  }

  // If image is very large, scale down to prevent memory issues
  const maxDimension = 3000;
  if (originalWidth > maxDimension || originalHeight > maxDimension) {
    const scale = Math.min(
      maxDimension / originalWidth,
      maxDimension / originalHeight,
    );
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
    };
  }

  // Use target dimensions if provided, maintaining aspect ratio
  if (targetWidth && !targetHeight) {
    const scale = targetWidth / originalWidth;
    return {
      width: targetWidth,
      height: Math.round(originalHeight * scale),
    };
  }

  // Return original dimensions if they seem reasonable
  return { width: originalWidth, height: originalHeight };
}

/**
 * Enhance contrast using histogram equalization
 */
function enhanceContrast(imageData: ImageData): ImageData {
  const data = imageData.data;
  const pixelCount = data.length / 4;

  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    histogram[gray]++;
  }

  // Calculate cumulative distribution
  const cdf = new Array(256).fill(0);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Normalize CDF
  const cdfMin = cdf.find((v) => v > 0) || 0;
  const scale = 255 / (pixelCount - cdfMin);

  // Apply equalization
  const lookupTable = new Array(256);
  for (let i = 0; i < 256; i++) {
    lookupTable[i] = Math.round((cdf[i] - cdfMin) * scale);
  }

  // Apply to image
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    const newValue = lookupTable[gray];
    data[i] = newValue; // R
    data[i + 1] = newValue; // G
    data[i + 2] = newValue; // B
    // Alpha unchanged
  }

  return imageData;
}

/**
 * Simple noise reduction using median filter (3x3)
 */
function denoise(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Collect 3x3 neighborhood
      const neighbors: number[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          neighbors.push(data[nIdx]); // Use red channel (grayscale)
        }
      }

      // Get median
      neighbors.sort((a, b) => a - b);
      const median = neighbors[4]; // Middle of 9 values

      output[idx] = median;
      output[idx + 1] = median;
      output[idx + 2] = median;
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Apply binary threshold
 */
function applyThreshold(imageData: ImageData, threshold: number): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    const value = gray > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  return imageData;
}

/**
 * Preprocess PDF page for OCR (when PDF has no text layer)
 * Simplified version - just convert canvas to blob
 */
export async function preprocessPdfPage(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Failed to convert canvas to blob")),
      "image/png",
      1.0,
    );
  });
}
