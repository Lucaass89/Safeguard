import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: fileURLToPath(new URL('../extension', import.meta.url)),
    emptyOutDir: false,
    minify: true,
    copyPublicDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/lib/analisis.js', import.meta.url)),
      formats: ['es'],
      fileName: () => 'analisis.js',
    },
  },
})
