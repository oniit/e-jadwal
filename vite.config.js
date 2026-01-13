import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'public/dist',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'public/js/admin/main.js'),
      name: 'AdminApp',
      fileName: () => 'admin.bundle.js',
      formats: ['iife']
    }
  }
})
