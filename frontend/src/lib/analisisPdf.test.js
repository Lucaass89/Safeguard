import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizarPdf, inspeccionarBytes } from './analisisPdf.js'

const PDF = '%PDF-1.4\n1 0 obj << /Type /Catalog /OpenAction 2 0 R >> endobj\n2 0 obj << /S /JavaScript /JS (app.alert(1);) >> endobj\n%%EOF'

function pdfjsQueSeQuedaConElArchivo() {
  return async () => ({
    getDocument({ data }) {
      structuredClone(data, { transfer: [data] })
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
