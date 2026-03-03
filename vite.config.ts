import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        // Copy PDF.js worker to public directory for production
        {
          src: path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
          dest: '.'
        },
        // Copy Tesseract.js trained data (optional - can also load from CDN)
        {
          src: path.resolve(__dirname, 'node_modules/tesseract.js/dist/worker.min.js'),
          dest: 'tesseract'
        }
      ]
    }),
    mode === 'analyze' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: mode !== 'production',
    cssMinify: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'router': ['@tanstack/react-router'],
          'query': ['@tanstack/react-query'],
          'charts': ['recharts'],
          'ocr': ['tesseract.js'],
          'pdf': ['pdfjs-dist'],
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? 'asset';
          if (/\.css$/i.test(name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['tesseract.js', 'pdfjs-dist', 'react', 'react-dom'],
    exclude: ['@tanstack/router-devtools'],
  },
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: 4173,
  },
}));
