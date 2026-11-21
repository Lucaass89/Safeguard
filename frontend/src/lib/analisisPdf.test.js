import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizarPdf, copiaParaPdfjs, inspeccionarBytes } from './analisisPdf.js'

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

const PDF = '%PDF-1.4\n1 0 obj << /Type /Catalog /OpenAction 2 0 R >> endobj\n2 0 obj << /S /JavaScript /JS (app.alert(1);) >> endobj\n%%EOF'

function pdfjsQueSeQuedaConElArchivo() {
  return async () => ({
    getDocument({ data }) {
      structuredClone(data, { transfer: [data.buffer ?? data] })
      return {
        promise: Promise.resolve({
          numPages: 1,
          getAttachments: async () => null,
          getJSActions: async () => null,
          getOpenAction: async () => null,
          getPage: async () => ({
            getAnnotations: async () => [],
            getJSActions: async () => [],
            getTextContent: async () => ({ items: [{ str: 'Factura de noviembre' }] }),
          }),
        }),
      }
    },
  })
}

test('lee el PDF aunque pdf.js se quede con los datos que recibe', async () => {
  const archivo = { name: 'factura.pdf', arrayBuffer: async () => new TextEncoder().encode(PDF).buffer }
  const resultado = await analizarPdf(archivo, pdfjsQueSeQuedaConElArchivo())
  assert.ok(resultado.motivos.some((motivo) => /JavaScript/.test(motivo)))
  assert.notEqual(resultado.nivel, 'verde')
})

test('encuentra JavaScript y acciones automáticas en los bytes', () => {
  const marcas = inspeccionarBytes(new TextEncoder().encode(PDF))
  assert.equal(marcas.javascript, true)
  assert.equal(marcas.automatico, true)
})

test('abrir en la página 1 no cuenta como una acción automática', () => {
  const marcas = inspeccionarBytes(new TextEncoder().encode('%PDF-1.4\n1 0 obj << /Type /Catalog /OpenAction[3 0 R /XYZ null null 0] >> endobj'))
  assert.equal(marcas.automatico, false)
  assert.equal(marcas.javascript, false)
})
