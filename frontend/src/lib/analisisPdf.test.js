import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copiaParaPdfjs, inspeccionarBytes } from './analisisPdf.js'

function bytesDe(texto) {
  return new TextEncoder().encode(texto).buffer
}

test('los bytes del PDF siguen disponibles aunque pdf.js se quede con su copia', () => {
  const original = bytesDe('%PDF-1.4 /JavaScript (app.alert)')
  const copia = copiaParaPdfjs(original)
  structuredClone(copia.buffer, { transfer: [copia.buffer] })
  assert.equal(copia.buffer.byteLength, 0)
  assert.ok(original.byteLength > 0)
  assert.equal(inspeccionarBytes(original).javascript, true)
})

test('la copia trae los mismos bytes y no comparte memoria', () => {
  const original = new Uint8Array([37, 80, 68, 70])
  const copia = copiaParaPdfjs(original)
  assert.deepEqual([...copia], [...original])
  assert.notEqual(copia.buffer, original.buffer)
})

test('inspeccionarBytes encuentra lanzamientos y archivos adjuntos', () => {
  const marcas = inspeccionarBytes(bytesDe('/Launch /EmbeddedFile'))
  assert.equal(marcas.launch, true)
  assert.equal(marcas.embebido, true)
  assert.equal(inspeccionarBytes(bytesDe('%PDF-1.4 texto comun')).javascript, false)
})
