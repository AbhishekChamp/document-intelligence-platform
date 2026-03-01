import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
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
