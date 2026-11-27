import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { htmlDePagina, PAGINAS } from '../../src/lib/metaPaginas.js'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist')
const base = readFileSync(join(dist, 'index.html'), 'utf8')

writeFileSync(join(dist, 'index.html'), htmlDePagina(base, '/'))
for (const ruta of Object.keys(PAGINAS)) {
  if (ruta === '/') continue
  const carpeta = join(dist, ruta.slice(1))
  mkdirSync(carpeta, { recursive: true })
  writeFileSync(join(carpeta, 'index.html'), htmlDePagina(base, ruta))
  console.log(`Página ${ruta} lista`)
}
