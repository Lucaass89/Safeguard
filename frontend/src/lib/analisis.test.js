import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  analizar,
  combinarConAmenaza,
  combinarConEnriquecimiento,
  marcarSinVerificar,
  SIN_FORMATO,
} from './analisis.js'
import { analizarWhatsapp, enlacesEn } from './analisisWhatsapp.js'

describe('nunca da Seguro si la dirección no se puede verificar', () => {
  for (const entrada of [
    'wwww.tikt0ok.-com',
    "wwww.tikt'ok.-com",
    'tiktok.-com',
    'sitio..com',
    'hola',
    'ejemplo.c0m',
    'exa_mple.com',
    '-banco.com',
  ]) {
    test(entrada, () => {
      const resultado = analizar(entrada)
      assert.ok(resultado, 'tiene que poder leerse como enlace')
      assert.notEqual(resultado.nivel, 'verde')
      assert.equal(resultado.sinVerificar, true)
    })
  }

  test('queda en gris con el motivo de formato', () => {
    const resultado = analizar('ejemplo.-com')
    assert.equal(resultado.nivel, 'gris')
    assert.equal(resultado.motivos[0], SIN_FORMATO)
  })

  test('un dominio inválido que imita una marca queda en Sospechoso, sin verificar', () => {
    const resultado = analizar("wwww.tikt'ok.-com")
    assert.equal(resultado.nivel, 'amarillo')
    assert.equal(resultado.sinVerificar, true)
    assert.equal(resultado.motivos[0], SIN_FORMATO)
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('TikTok (tiktok.com)')))
  })
})

describe('doble w y letras cambiadas', () => {
  test('wwww. no pasa como verde', () => {
    const resultado = analizar('wwww.tiktok.com')
    assert.equal(resultado.nivel, 'amarillo')
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('"wwww."')))
  })

  test('ww. no pasa como verde', () => {
    assert.notEqual(analizar('ww.mercadolibre.com.ar').nivel, 'verde')
  })

  test('una letra cambiada por un número es Peligroso; una letra de más en una marca corta, Precaución', () => {
    assert.equal(analizar('www.g0ogle.com').nivel, 'rojo')
    assert.equal(analizar('tikt0ok.com').nivel, 'amarillo')
  })

  test('paypa1.com es Peligroso aun sin otra señal', () => {
    assert.equal(analizar('https://paypa1.com').nivel, 'rojo')
    assert.equal(analizar('https://paypa1.com/login').nivel, 'rojo')
  })
})

describe('URL malformada', () => {
  for (const entrada of ['http://', 'ht!tp://exa mple']) {
    test(JSON.stringify(entrada), () => {
      const resultado = analizar(entrada)
      assert.equal(resultado.nivel, 'gris')
      assert.equal(resultado.motivos[0], SIN_FORMATO)
    })
  }

  test('javascript: es rojo y ftp: no se puede verificar', () => {
    assert.equal(analizar('javascript:alert(1)').nivel, 'rojo')
    assert.equal(analizar('ftp://sitio.com').nivel, 'gris')
  })
})

describe('sitios reales siguen en verde', () => {
  for (const entrada of ['https://www.google.com', 'mercadolibre.com.ar', 'https://www.argentina.gob.ar']) {
    test(entrada, () => {
      const resultado = analizar(entrada)
      assert.equal(resultado.nivel, 'verde')
      assert.equal(resultado.sinVerificar, false)
    })
  }

  test('www. normal no suma', () => {
    assert.equal(analizar('www.google.com').puntuacion, 0)
    assert.equal(analizar('www.google.com').nivel, 'verde')
  })
})

describe('lo que no se pudo verificar después', () => {
  test('si no se pudo abrir el sitio, un verde pasa a gris', () => {
    const final = marcarSinVerificar(analizar('ejemplo.com'), 'No pudimos abrir el sitio.')
    assert.equal(final.nivel, 'gris')
    assert.ok(final.motivos.includes('No pudimos abrir el sitio.'))
  })

  test('un rojo sigue rojo', () => {
    assert.equal(marcarSinVerificar(analizar('www.g0ogle.xyz'), 'x.').nivel, 'rojo')
  })

  test('una imitación de marca sigue en Sospechoso aunque no se pueda abrir', () => {
    assert.equal(marcarSinVerificar(analizar('tikt0ok.com'), 'x.').nivel, 'amarillo')
  })

  test('la base de amenazas no lo vuelve verde', () => {
    assert.equal(combinarConAmenaza(analizar('ejemplo.-com'), null).nivel, 'gris')
  })

  test('el enriquecimiento no lo vuelve verde', () => {
    assert.equal(combinarConEnriquecimiento(analizar('ejemplo.-com'), { dominio: 'ejemplo.-com' }).nivel, 'gris')
  })

  test('un acortador que termina en un dominio inválido queda sin verificar', () => {
    const final = combinarConEnriquecimiento(analizar('https://bit.ly/abc'), {
      acortado: true,
      destino: 'https://wwww.tikt0ok.-com/',
      dominio: 'tikt0ok.-com',
    })
    assert.notEqual(final.nivel, 'verde')
    assert.equal(final.sinVerificar, true)
  })
})

describe('enlaces en un texto compartido o copiado', () => {
  test('saca el enlace de un mensaje', () => {
    assert.deepEqual(enlacesEn('Mirá esto: https://g0ogle.com/premio ya'), ['https://g0ogle.com/premio'])
  })

  test('encuentra un dominio sin https', () => {
    assert.deepEqual(enlacesEn('entrá a mercadolibr3.com'), ['mercadolibr3.com'])
  })

  test('destapa un enlace camuflado', () => {
    assert.ok(enlacesEn('hxxps://banco-seguro[.]xyz/login').some((enlace) => enlace.includes('banco-seguro.xyz')))
  })

  test('no se come las w de más', () => {
    assert.deepEqual(enlacesEn('Mirá esto wwww.tikt0ok.-com/video'), ['wwww.tikt0ok.-com/video'])
    assert.deepEqual(enlacesEn('entrá a www.google.com'), ['www.google.com'])
  })

  test('un texto sin enlaces no devuelve nada', () => {
    assert.deepEqual(enlacesEn('Hola, ¿cómo andás?'), [])
  })
})

describe('mensajes', () => {
  test('un mensaje con un enlace inválido no da verde', () => {
    const resultado = analizarWhatsapp('Mirá esto: https://wwww.tikt0ok.-com/video')
    assert.notEqual(resultado.nivel, 'verde')
    assert.equal(resultado.sinVerificar, true)
  })

  test('revisar el enlace en el servidor no baja el nivel que ya tenía el texto del mensaje', () => {
    const texto = 'Hola, soy del Banco. Tu cuenta se bloquea hoy. Mandame el código que te llegó por SMS y entrá acá: bit.ly/3xYzAbc'
    const local = analizarWhatsapp(texto)
    assert.equal(local.nivel, 'rojo')
    const final = combinarConEnriquecimiento(local, {
      destino: 'https://bit.ly/3xYzAbc',
      cadena: ['https://bit.ly/3xYzAbc'],
      fallo: 'no_resuelve',
    })
    assert.equal(final.nivel, 'rojo')
    assert.ok(final.puntuacion >= local.puntuacion)
  })

  test('un enlace sano no sube por el piso del texto', () => {
    const final = combinarConEnriquecimiento(analizar('https://www.mercadolibre.com.ar'), { dominio: 'mercadolibre.com.ar' })
    assert.equal(final.nivel, 'verde')
  })
})
