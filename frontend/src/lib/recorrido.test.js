import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analizar, combinarConEnriquecimiento, FALLO_AL_SEGUIR } from './analisis.js'
import { dominiosDelRecorrido, sinConsulta, sinFragmento } from './enlace.js'
import { armarConsulta } from './faro.js'

describe('qué sale del sistema', () => {
  test('al backend propio no le llega el fragmento', () => {
    assert.equal(sinFragmento('https://ejemplo.com/a?b=1#secreto'), 'https://ejemplo.com/a?b=1')
    assert.equal(sinFragmento('ejemplo.com'), 'ejemplo.com')
  })

  test('a un servicio externo le llega el sitio y la ruta, sin query, fragmento ni usuario', () => {
    assert.equal(sinConsulta('https://ana:clave@ejemplo.com/reset?token=abc#x'), 'https://ejemplo.com/reset')
    assert.equal(sinConsulta('javascript:alert(document.cookie)'), 'javascript:')
  })

  test('Faro recibe la dirección recortada y deja igual lo que no es una dirección', () => {
    const conUrl = armarConsulta('rojo', [], '¿Qué hago?', [], 'simple', {
      url: 'https://banco-trucho.com/login?dni=12345678&mail=ana@correo.com',
    })
    assert.equal(conUrl.caso.url, 'https://banco-trucho.com/login')

    const sinUrl = armarConsulta('rojo', [], '¿Qué hago?', [], 'simple', { url: 'factura.pdf' })
    assert.equal(sinUrl.caso.url, 'factura.pdf')
  })
})

describe('dominios del recorrido', () => {
  test('junta cada dominio de la cadena y de la redirección de la página, sin repetir', () => {
    const dominios = dominiosDelRecorrido({
      cadena: ['https://bit.ly/x', 'https://www.paypa1.com/a', 'https://paypa1.com/b', 'intent://scan/'],
      meta_destino: 'https://cobros.ejemplo.com.ar/',
    })
    assert.deepEqual(dominios, ['bit.ly', 'paypa1.com', 'ejemplo.com.ar'])
    assert.deepEqual(dominiosDelRecorrido(null), [])
  })
})

describe('cadena de redirecciones', () => {
  test('un dominio parecido a una marca que lleva al sitio real sigue en Sospechoso', () => {
    const final = combinarConEnriquecimiento(analizar('https://tikt0ok.com/'), {
      cadena: ['https://tikt0ok.com/', 'https://www.tiktok.com/'],
      destino: 'https://www.tiktok.com/',
      dominio: 'tiktok.com',
      edad_dias: 4000,
    })
    assert.equal(final.nivel, 'amarillo')
    assert.ok(
      final.motivos.includes(
        'Termina en tiktok.com, que es un sitio oficial, pero la dirección original imita a TikTok: que redirija a un sitio real no la vuelve confiable.',
      ),
    )
    assert.deepEqual(final.cadena, ['https://tikt0ok.com/', 'https://www.tiktok.com/'])
  })

  test('un salto intermedio con señales se cuenta aunque el destino sea oficial', () => {
    const final = combinarConEnriquecimiento(analizar('https://bit.ly/abc'), {
      cadena: ['https://bit.ly/abc', 'https://paypa1.com/cobro', 'https://www.paypal.com/'],
      destino: 'https://www.paypal.com/',
      dominio: 'paypal.com',
    })
    assert.notEqual(final.nivel, 'verde')
    assert.ok(final.motivos.includes('En el camino pasa por paypa1.com.'))
  })

  test('un salto intermedio sin señales no agrega motivos', () => {
    const final = combinarConEnriquecimiento(analizar('https://bit.ly/abc'), {
      cadena: ['https://bit.ly/abc', 'https://bitly.com/abc', 'https://www.mercadolibre.com.ar/'],
      destino: 'https://www.mercadolibre.com.ar/',
      dominio: 'mercadolibre.com.ar',
    })
    assert.equal(final.nivel, 'verde')
    assert.ok(!final.motivos.some((motivo) => motivo.startsWith('En el camino')))
  })

  test('si el destino también es un acortador pero ya se llegó al final, no dice que no se ve a dónde lleva', () => {
    const final = combinarConEnriquecimiento(analizar('http://bit.ly/'), {
      cadena: ['http://bit.ly/', 'https://bitly.com/'],
      destino: 'https://bitly.com/',
      dominio: 'bitly.com',
    })
    assert.ok(final.motivos.includes('El acortador lleva a bitly.com.'))
    assert.ok(!final.motivos.some((motivo) => motivo.startsWith('Es un acortador')))
  })

  test('la redirección propia de la página se suma al final de la cadena', () => {
    const final = combinarConEnriquecimiento(analizar('https://ejemplo.com.ar/'), {
      cadena: ['https://ejemplo.com.ar/'],
      destino: 'https://ejemplo.com.ar/',
      dominio: 'ejemplo.com.ar',
      meta_destino: 'https://otro-sitio.com/',
    })
    assert.deepEqual(final.cadena, ['https://ejemplo.com.ar/', 'https://otro-sitio.com/'])
  })
})

describe('cuando el servidor no llega al final', () => {
  test('un dominio que no existe queda en No pudimos verificarlo, con el motivo real', () => {
    const final = combinarConEnriquecimiento(analizar('https://esto-no-existe-sg.com/'), {
      fallo: 'no_resuelve',
      cadena: ['https://esto-no-existe-sg.com/'],
      destino: 'https://esto-no-existe-sg.com/',
      dominio: 'esto-no-existe-sg.com',
    })
    assert.equal(final.nivel, 'gris')
    assert.equal(final.falloAlSeguir, 'no_resuelve')
    assert.ok(final.motivos.includes(FALLO_AL_SEGUIR.no_resuelve))
  })

  test('un parecido a una marca que no responde sigue en Sospechoso', () => {
    const final = combinarConEnriquecimiento(analizar('https://g0ogle.com/'), {
      fallo: 'tls',
      cadena: ['https://g0ogle.com/'],
      destino: 'https://g0ogle.com/',
      dominio: 'g0ogle.com',
    })
    assert.equal(final.nivel, 'amarillo')
    assert.ok(final.sinVerificar)
    assert.ok(final.motivos.includes(FALLO_AL_SEGUIR.tls))
  })

  test('una redirección a una red interna se corta y nunca queda en verde', () => {
    const final = combinarConEnriquecimiento(analizar('https://tienda-ejemplo.com.ar/'), {
      fallo: 'bloqueado',
      cadena: ['https://tienda-ejemplo.com.ar/', 'http://10.0.0.1/'],
      destino: 'http://10.0.0.1/',
      dominio: '10.0.0.1',
    })
    assert.notEqual(final.nivel, 'verde')
    assert.ok(final.motivos.includes(FALLO_AL_SEGUIR.bloqueado))
    assert.deepEqual(final.cadena, ['https://tienda-ejemplo.com.ar/', 'http://10.0.0.1/'])
  })

  test('una redirección a código javascript: es Peligroso', () => {
    const final = combinarConEnriquecimiento(analizar('https://bit.ly/abc'), {
      fallo: 'protocolo',
      cadena: ['https://bit.ly/abc', 'javascript:alert(1)'],
      destino: 'javascript:alert(1)',
      dominio: null,
    })
    assert.equal(final.nivel, 'rojo')
    assert.ok(final.motivos.includes('El acortador no lleva a una página web.'))
  })

  test('cinco saltos seguidos cortan el recorrido sin dar un veredicto limpio', () => {
    const cadena = ['https://a.com/', 'https://b.com/', 'https://c.com/', 'https://d.com/', 'https://e.com/', 'https://f.com/']
    const final = combinarConEnriquecimiento(analizar('https://a.com/'), {
      fallo: 'saltos',
      cadena,
      destino: 'https://f.com/',
      dominio: 'f.com',
    })
    assert.equal(final.nivel, 'gris')
    assert.ok(final.motivos.includes(FALLO_AL_SEGUIR.saltos))
  })
})
