import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'public/dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'public/js/admin/main.js'),
        public: path.resolve(__dirname, 'public/js/public/main.js'),
      },
      output: {
        entryFileNames: '[name].bundle.js',
        format: 'es',
        inlineDynamicImports: false
      }
    }
  }
})
