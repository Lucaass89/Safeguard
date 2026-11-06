import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

const OPCIONES = {
  formats: ['QRCode'],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  maxNumberOfSymbols: 4,
}

let modulo = null

function cargar() {
  modulo ??= import('zxing-wasm/reader')
    .then(async (zxing) => {
      await zxing.prepareZXingModule({
        overrides: {
          locateFile: (ruta, prefijo) => (ruta.endsWith('.wasm') ? wasmUrl : prefijo + ruta),
        },
        fireImmediately: true,
      })
      return zxing
    })
    .catch((error) => {
      modulo = null
      throw error
    })
  return modulo
}

export function prepararLector() {
  return cargar().then(() => true)
}

export async function leerCodigos(fuente) {
  const zxing = await cargar()
  const lecturas = await zxing.readBarcodes(fuente, OPCIONES)
  const area = ({ position: p }) =>
    Math.abs((p.topRight.x - p.topLeft.x) * (p.bottomLeft.y - p.topLeft.y))
  const validas = lecturas.filter((lectura) => lectura.isValid && lectura.text).sort((a, b) => area(b) - area(a))
  return [...new Set(validas.map((lectura) => lectura.text))]
}
