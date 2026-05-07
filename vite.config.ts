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
    // wasm-vips and onnxruntime-web ship their own wasm loaders; pre-bundling 
    // breaks their relative asset resolution and serves HTML for .wasm/.mjs files.
    exclude: ['wasm-vips', 'onnxruntime-web'],
    esbuildOptions: {
      target: 'ES2020',
    },
  },
  // wasm-vips WASM binary handling
  assetsInclude: ['**/*.wasm'],
})
