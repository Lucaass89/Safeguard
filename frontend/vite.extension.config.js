import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  logLevel: 'warn',
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/lib/extension.js', import.meta.url)),
      formats: ['es'],
      fileName: () => 'detector.js',
    },
    outDir: fileURLToPath(new URL('../extension', import.meta.url)),
    emptyOutDir: false,
    copyPublicDir: false,
    minify: false,
    reportCompressedSize: false,
  },
})
