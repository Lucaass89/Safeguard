import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import datosPlataformas from '../data/plataformas.json' with { type: 'json' }
import { analizar, combinarConEnriquecimiento, esDominioOficial } from './analisis.js'
import { dominioRegistrable } from './enlace.js'
import { distanciaDL, MARCAS, marcaEnTexto, plataformaDe, umbral, variantes } from './marcas.js'

const nivel = (entrada) => analizar(entrada).nivel
const motivos = (entrada) => analizar(entrada).motivos.join(' ')

describe('archivo de marcas', () => {
  test('cada dominio oficial es un dominio registrable exacto', () => {
    for (const marca of MARCAS) {
      assert.ok(marca.nombre && marca.oficiales.length > 0, marca.id)
      for (const oficial of marca.oficiales) assert.equal(dominioRegistrable(oficial), oficial, `${marca.id}: ${oficial}`)
    }
  })

  test('ids únicos y ningún dominio oficial repetido entre marcas', () => {
    const ids = MARCAS.map((marca) => marca.id)
    assert.equal(new Set(ids).size, ids.length)
    const oficiales = MARCAS.flatMap((marca) => marca.oficiales)
    assert.equal(new Set(oficiales).size, oficiales.length)
  })

  test('están las marcas pedidas para Argentina', () => {
    for (const id of [
      'tiktok', 'google', 'whatsapp', 'instagram', 'facebook', 'mercadolibre', 'mercadopago', 'arca', 'anses',
      'nacion', 'galicia', 'santander', 'bbva', 'macro', 'brubank', 'naranjax', 'uala', 'correoargentino',
      'andreani', 'netflix', 'microsoft', 'apple', 'paypal',
    ]) {
      assert.ok(MARCAS.some((marca) => marca.id === id), id)
    }
  })

  test('las plataformas se escriben como nombres de dominio', () => {
    for (const lista of [datosPlataformas.contenidoDeTerceros, datosPlataformas.direccionesTemporales, datosPlataformas.acortadores]) {
      for (const nombre of lista) assert.match(nombre, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, nombre)
    }
  })
})

describe('confusables y distancia', () => {
  test('deshace números, rn, vv y homóglifos', () => {
    assert.ok(variantes('g00gle').includes('google'))
    assert.ok(variantes('paypa1').includes('paypal'))
    assert.ok(variantes('1nstagram').includes('instagram'))
    assert.ok(variantes('5antander').includes('santander'))
    assert.ok(variantes('rnacro').includes('macro'))
    assert.ok(variantes('vvhatsapp').includes('whatsapp'))
    assert.ok(variantes('аррӏе').includes('apple'))
    assert.ok(variantes('mercadolíbre').includes('mercadolibre'))
  })

  test('Damerau-Levenshtein cuenta una inversión de letras vecinas como un solo error', () => {
    assert.equal(distanciaDL('tiktko', 'tiktok'), 1)
    assert.equal(distanciaDL('tiktook', 'tiktok'), 1)
    assert.equal(distanciaDL('google', 'google'), 0)
    assert.equal(distanciaDL('gogle', 'google'), 1)
  })

  test('el umbral depende del largo', () => {
    assert.equal(umbral(4), 0)
    assert.equal(umbral(6), 1)
    assert.equal(umbral(12), 2)
  })
})

describe('dominios parecidos a una marca', () => {
  for (const entrada of [
    'tikt0ok.com',
    'tiktko.com',
    'www.g0ogle.com',
    'paypa1.com',
    'rnercadopago.com.ar',
    'vvhatsapp.com',
    '1nstagram.com',
    'faceb00k.com',
    'mercadolirbe.com',
    'mercadolibre-ar.com',
    'bancogalicia-online.com',
    'arca-tramites.com',
    'andreani-envios.com',
    'correo-argentino.com',
    'uala-ar.com',
    'netfIix.com',
  ]) {
    test(`${entrada} es por lo menos Sospechoso`, () => {
      assert.notEqual(nivel(entrada), 'verde')
      assert.notEqual(nivel(entrada), 'gris')
    })
  }

  test('"wwww.tikt0ok.-com" y "wwww.tikt\'ok.-com" caen como imitación de TikTok', () => {
    for (const entrada of ['wwww.tikt0ok.-com', "wwww.tikt'ok.-com"]) {
      assert.equal(nivel(entrada), 'amarillo')
      assert.ok(motivos(entrada).includes('TikTok (tiktok.com)'))
    }
  })

  test('el motivo nombra la marca y su dominio oficial', () => {
    assert.ok(motivos('tikt0ok.com').includes('"tikt0ok" se parece a TikTok (tiktok.com)'))
    assert.ok(motivos('www.g0ogle.com').includes('Google (google.com)'))
  })

  test('con otra señal fuerte pasa a Peligroso', () => {
    assert.equal(nivel('g0ogle.xyz'), 'rojo')
    assert.equal(nivel('mercadolibre-pagos.com'), 'rojo')
    assert.equal(nivel('galicia-seguridad.com'), 'rojo')
    assert.equal(nivel('http://paypa1.com.ar/login'), 'rojo')
    assert.equal(nivel('xn--80ak6aa92e.com'), 'rojo')
  })

  test('una marca de nombre largo es Peligroso sola; una corta y dudosa, Precaución', () => {
    assert.equal(nivel('mercadolibre-ar.com'), 'rojo')
    assert.equal(nivel('mercadollibre.com'), 'rojo')
    assert.equal(nivel('tikt0ok.com'), 'amarillo')
    assert.equal(nivel('amazon.de'), 'amarillo')
  })

  test('un dominio nuevo suma como señal fuerte después de abrirlo', () => {
    const final = combinarConEnriquecimiento(analizar('tikt0ok.com'), {
      destino: 'https://tikt0ok.com/',
      dominio: 'tikt0ok.com',
      edad_dias: 3,
    })
    assert.equal(final.nivel, 'rojo')
  })

  test('muestra la letra cambiada', () => {
    const { diferencia } = analizar('www.g0ogle.com')
    assert.ok(diferencia)
    assert.deepEqual(
      diferencia.visto.filter((tramo) => tramo.trucho).map((tramo) => tramo.texto),
      ['0'],
    )
  })
})

describe('marca en otra parte de la dirección', () => {
  test('tiktok.com.verificar-cuenta.xyz: la marca está en el subdominio', () => {
    const resultado = analizar('tiktok.com.verificar-cuenta.xyz')
    assert.equal(resultado.dominio, 'verificar-cuenta.xyz')
    assert.equal(resultado.nivel, 'rojo')
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('el sitio es verificar-cuenta.xyz')))
  })

  test('google.com.evil.com y mercadolibre.com.ar.evil.com no pasan como oficiales', () => {
    assert.equal(nivel('google.com.evil.com'), 'rojo')
    assert.equal(nivel('mercadolibre.com.ar.evil.com'), 'rojo')
  })

  test('la marca en el camino junto a una página de acceso', () => {
    const resultado = analizar('ejemplo.com/mercadopago/login')
    assert.notEqual(resultado.nivel, 'verde')
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('Nombra a Mercado Pago en el camino')))
  })

  test('la marca en un parámetro que nombra el dominio oficial', () => {
    assert.ok(motivos('ejemplo.com/ir?sitio=mercadopago.com.ar').includes('Nombra a Mercado Pago en un parámetro'))
  })

  test('una nota que menciona la marca o un parámetro de seguimiento no suman', () => {
    assert.equal(nivel('https://www.lanacion.com.ar/economia/mercadopago-anuncia-cambios'), 'verde')
    assert.equal(nivel('https://ejemplo.com/?utm_source=facebook'), 'verde')
  })
})

describe('lista de confianza: dominio registrable exacto', () => {
  test('los oficiales y sus subdominios son oficiales', () => {
    assert.ok(esDominioOficial('accounts.google.com'))
    assert.ok(esDominioOficial('www.galicia.ar'))
    assert.ok(esDominioOficial('mercadolibre.com.ar'))
  })

  test('no alcanza con contener o terminar con el nombre', () => {
    assert.equal(esDominioOficial('evilgoogle.com'), false)
    assert.equal(esDominioOficial('google.com.evil.com'), false)
    assert.equal(esDominioOficial('mercadolibre.com.ar.evil.com'), false)
    assert.equal(esDominioOficial('notiktok.com'), false)
  })

  for (const entrada of [
    'https://www.google.com',
    'mercadolibre.com.ar',
    'www.galicia.ar',
    'bancogalicia.com',
    'www.tiktok.com',
    'santanderrio.com.ar',
    'mercadolivre.com.br',
    'mercadolibre.com.ar/login',
  ]) {
    test(`${entrada} sigue en verde`, () => assert.equal(nivel(entrada), 'verde'))
  }
})

describe('palabras reales que no son imitaciones', () => {
  for (const entrada of [
    'clarin.com',
    'infobae.com',
    'pagina12.com.ar',
    'finance.yahoo.com',
    'email.com',
    'apply.com',
    'macro.com',
    'marco.com',
    'arcadia.com',
    'telegraf.com',
    'personalshop.com',
    'españa.com',
  ]) {
    test(entrada, () => assert.equal(nivel(entrada), 'verde'))
  }
})

describe('contenido de terceros', () => {
  for (const entrada of [
    'https://docs.google.com/forms/d/abc/viewform',
    'https://drive.google.com/file/d/abc/view',
    'https://sites.google.com/view/algo',
    'https://alguien.github.io',
    'https://proyecto.firebaseapp.com',
    'https://pagina.notion.site',
    'https://alguien.blogspot.com',
    'https://alguien.wixsite.com/sitio',
  ]) {
    test(`${entrada} no es Seguro: avisa que el contenido es de otra persona`, () => {
      const resultado = analizar(entrada)
      assert.equal(resultado.nivel, 'gris')
      assert.ok(resultado.motivos.some((motivo) => motivo.includes('el contenido lo creó otra persona')))
    })
  }

  test('la edad del dominio de la plataforma no cuenta como dato a favor', () => {
    const final = combinarConEnriquecimiento(analizar('https://docs.google.com/forms/d/abc/viewform'), {
      destino: 'https://docs.google.com/forms/d/abc/viewform',
      dominio: 'google.com',
      edad_dias: 10000,
      frase_edad: 'Este dominio lleva 27 años registrado: es un dato a favor.',
    })
    assert.equal(final.nivel, 'gris')
    assert.ok(!final.motivos.some((motivo) => motivo.includes('dato a favor')))
  })

  test('el nombre de la plataforma se respeta con el punto', () => {
    assert.equal(plataformaDe('falsogithub.io'), null)
    assert.equal(plataformaDe('alguien.github.io')?.tipo, 'contenido')
  })

  test('una marca dentro de una plataforma de terceros es Peligroso', () => {
    assert.equal(nivel('mercadopago.github.io'), 'rojo')
    assert.equal(nivel('tikt0k.github.io'), 'rojo')
  })

  test('una marca en una página de Google Sites suma', () => {
    assert.ok(motivos('https://sites.google.com/view/mercadopago').includes('el sitio es sites.google.com'))
  })
})

describe('acortadores', () => {
  test('bit.ly no es Seguro hasta saber a dónde lleva', () => {
    const resultado = analizar('https://bit.ly/abc')
    assert.equal(resultado.nivel, 'gris')
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('acortador')))
  })

  test('el veredicto final sale del destino', () => {
    const real = combinarConEnriquecimiento(analizar('https://bit.ly/abc'), {
      acortado: true,
      destino: 'https://www.mercadolibre.com.ar/',
      dominio: 'mercadolibre.com.ar',
    })
    assert.equal(real.nivel, 'verde')
    assert.ok(real.motivos.includes('El acortador lleva a mercadolibre.com.ar.'))

    const trucho = combinarConEnriquecimiento(analizar('https://bit.ly/abc'), {
      acortado: true,
      destino: 'https://tikt0ok.com/',
      dominio: 'tikt0ok.com',
    })
    assert.equal(trucho.nivel, 'amarillo')
  })

  test('una redirección dentro del mismo sitio no se presenta como acortador', () => {
    const final = combinarConEnriquecimiento(analizar('mercadolibre.com.ar'), {
      acortado: true,
      destino: 'https://www.mercadolibre.com.ar/',
      dominio: 'mercadolibre.com.ar',
    })
    assert.equal(final.nivel, 'verde')
    assert.ok(!final.motivos.some((motivo) => motivo.includes('acortador')))
  })
})

describe('marca en un texto', () => {
  test('encuentra marcas de una y de varias palabras', () => {
    assert.equal(marcaEnTexto('Banco Galicia te avisa')?.marca, 'galicia')
    assert.equal(marcaEnTexto('Tu envío de Correo Argentino')?.marca, 'correoargentino')
    assert.equal(marcaEnTexto('ARCA: tenés una deuda')?.marca, 'arca')
  })

  test('las palabras comunes solas no son una marca', () => {
    assert.equal(marcaEnTexto('de todos modos, claro que sí'), null)
    assert.equal(marcaEnTexto('una macro de Excel'), null)
  })
})
