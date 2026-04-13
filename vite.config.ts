import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    // Headers for wasm-vips cross-origin isolation
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  optimizeDeps: {
    // wasm-vips ships its own wasm loader; pre-bundling breaks its relative
    // asset resolution and serves HTML for vips.wasm.
    exclude: ['wasm-vips'],
    esbuildOptions: {
      target: 'ES2020',
    },
  },
  // wasm-vips WASM binary handling
  assetsInclude: ['**/*.wasm'],
})
