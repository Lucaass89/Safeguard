import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analizar, combinarConEnriquecimiento, descargaConfiable, esApk, MOTIVO_APK } from './analisis.js'
import { analizarCorreo, MOTIVO_APK_CORREO } from './analisisCorreo.js'
import { analizarWhatsapp, MOTIVO_APK_MENSAJE } from './analisisWhatsapp.js'

describe('esApk', () => {
  test('reconoce un .apk en la ruta, con mayúsculas o con parámetros', () => {
    assert.equal(esApk('https://pagos-ar.com/comprobante.apk'), true)
    assert.equal(esApk('https://ejemplo.com/App.APK?x=1'), true)
    assert.equal(esApk('https://ejemplo.com/app.apk#arriba'), true)
  })

  test('no confunde otras cosas con un apk', () => {
    assert.equal(esApk('https://ejemplo.com/apk-mods'), false)
    assert.equal(esApk('https://ejemplo.com/app.apkg'), false)
    assert.equal(esApk('https://play.google.com/store/apps/details?id=com.whatsapp'), false)
  })
})

describe('descargaConfiable', () => {
  test('acepta F-Droid y el sitio de SafeGuard', () => {
    assert.equal(descargaConfiable('f-droid.org'), true)
    assert.equal(descargaConfiable('www.f-droid.org'), true)
    assert.equal(descargaConfiable('safeguardd.vercel.app'), true)
  })

  test('no acepta cualquier sitio de vercel', () => {
    assert.equal(descargaConfiable('safeguard-pagos.vercel.app'), false)
  })
})

describe('enlaces a un APK', () => {
  test('desde un sitio desconocido da rojo con el motivo del APK', () => {
    const resultado = analizar('https://pagos-ar.com/comprobante.apk')
    assert.equal(resultado.nivel, 'rojo')
    assert.ok(resultado.motivos.includes(MOTIVO_APK))
  })

  test('desde un sitio que imita a una marca da rojo', () => {
    assert.equal(analizar('https://bna-app.com/app.apk').nivel, 'rojo')
  })

  test('desde Google Drive da rojo: el archivo lo subió cualquiera', () => {
    assert.equal(analizar('https://drive.google.com/file/comprobante.apk').nivel, 'rojo')
  })

  test('desde el sitio oficial de una marca da amarillo, nunca verde', () => {
    const resultado = analizar('https://www.whatsapp.com/android/WhatsApp.apk')
    assert.equal(resultado.nivel, 'amarillo')
    assert.match(resultado.motivos[0], /Play Store/)
  })

  test('desde F-Droid o el sitio de SafeGuard da amarillo', () => {
    assert.equal(analizar('https://f-droid.org/F-Droid.apk').nivel, 'amarillo')
    assert.equal(analizar('https://safeguardd.vercel.app/app/safeguard-1.4.apk').nivel, 'amarillo')
  })

  test('el Play Store no es un APK y no se marca', () => {
    assert.equal(analizar('https://play.google.com/store/apps/details?id=com.whatsapp').nivel, 'verde')
  })

  test('otros ejecutables siguen dando rojo como antes', () => {
    assert.equal(analizar('https://descargas-gratis.com/factura.exe').nivel, 'rojo')
  })
})

describe('APK en un mensaje de WhatsApp', () => {
  test('un enlace a un APK da rojo aunque sea del sitio oficial', () => {
    const resultado = analizarWhatsapp('Hola, bajate la app nueva acá https://www.whatsapp.com/android/WhatsApp.apk')
    assert.equal(resultado.nivel, 'rojo')
    assert.equal(resultado.motivos[0], MOTIVO_APK_MENSAJE)
  })

  test('el nombre de un archivo .apk sin enlace también da rojo', () => {
    const resultado = analizarWhatsapp('Te mandé el comprobante.apk, abrilo para ver la transferencia')
    assert.equal(resultado.nivel, 'rojo')
    assert.ok(resultado.motivos.includes(MOTIVO_APK_MENSAJE))
  })

  test('hablar de apps sin mandar un archivo no lo marca', () => {
    const resultado = analizarWhatsapp('¿Ya probaste la app del banco? Está en el Play Store')
    assert.ok(!resultado.motivos.includes(MOTIVO_APK_MENSAJE))
  })
})

describe('APK en un correo', () => {
  const correo = (cuerpo, extra = '') =>
    `From: Avisos <avisos@ejemplo.com>\nSubject: Tu comprobante\n${extra}\n${cuerpo}`

  test('un adjunto .apk da rojo', () => {
    const resultado = analizarCorreo(
      correo('Adjuntamos el comprobante.', 'Content-Disposition: attachment; filename="comprobante.apk"\n'),
    )
    assert.equal(resultado.nivel, 'rojo')
    assert.ok(resultado.motivos.includes(MOTIVO_APK_CORREO))
  })

  test('un enlace a un APK da rojo aunque sea del sitio oficial', () => {
    const resultado = analizarCorreo(correo('Descargá la versión nueva: https://www.whatsapp.com/android/WhatsApp.apk'))
    assert.equal(resultado.nivel, 'rojo')
    assert.ok(resultado.motivos.includes(MOTIVO_APK_CORREO))
  })
})

describe('APK con lo que devuelve el servidor', () => {
  const conServidor = (url, extra = {}) =>
    combinarConEnriquecimiento(analizar(url), {
      dominio: analizar(url).dominio,
      destino: url,
      archivo_peligroso: true,
      ...extra,
    })

  test('F-Droid sigue en amarillo aunque el servidor vea que es una descarga', () => {
    const final = conServidor('https://f-droid.org/F-Droid.apk')
    assert.equal(final.nivel, 'amarillo')
    assert.ok(!final.motivos.some((motivo) => motivo.includes('descarga de programa')))
  })

  test('el sitio oficial de una marca y el de SafeGuard siguen en amarillo', () => {
    assert.equal(conServidor('https://www.whatsapp.com/android/WhatsApp.apk').nivel, 'amarillo')
    assert.equal(conServidor('https://safeguardd.vercel.app/app/safeguard-1.4.apk').nivel, 'amarillo')
  })

  test('un APK de un sitio desconocido sigue en rojo', () => {
    assert.equal(conServidor('https://pagos-ar.com/comprobante.apk').nivel, 'rojo')
  })

  test('si un enlace oficial redirige a un APK de otro sitio, da rojo', () => {
    const final = combinarConEnriquecimiento(analizar('https://www.whatsapp.com/descargar'), {
      dominio: 'descargas-apk.com',
      destino: 'https://descargas-apk.com/WhatsApp.apk',
      archivo_peligroso: true,
    })
    assert.equal(final.nivel, 'rojo')
  })
})
