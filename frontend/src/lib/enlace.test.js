import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analizar, SIN_FORMATO } from './analisis.js'
import { dominioRegistrable, LARGO_MAXIMO, leerEnlace } from './enlace.js'

function noVerificado(entrada) {
  const resultado = analizar(entrada)
  assert.equal(resultado.nivel, 'gris', `${entrada} tiene que quedar sin verificar`)
  assert.equal(resultado.sinVerificar, true)
  return resultado
}

describe('dominio registrable con la Public Suffix List', () => {
  test('google.com.ar y google.com.evil.com no son el mismo dominio', () => {
    assert.equal(dominioRegistrable('google.com.ar'), 'google.com.ar')
    assert.equal(dominioRegistrable('google.com.evil.com'), 'evil.com')
  })

  test('sufijos de dos niveles y subdominios', () => {
    assert.equal(dominioRegistrable('www.mercadolibre.com.ar'), 'mercadolibre.com.ar')
    assert.equal(dominioRegistrable('sub.algo.gob.mx'), 'algo.gob.mx')
    assert.equal(dominioRegistrable('a.b.c.ejemplo.co.uk'), 'ejemplo.co.uk')
  })

  test('cada sitio de un hosting compartido es un dominio aparte', () => {
    assert.equal(dominioRegistrable('estafa.vercel.app'), 'estafa.vercel.app')
    assert.equal(dominioRegistrable('estafa.github.io'), 'estafa.github.io')
  })

  test('google.com.evil.com se juzga como evil.com', () => {
    const resultado = analizar('google.com.evil.com')
    assert.equal(resultado.dominio, 'evil.com')
    assert.notEqual(resultado.nivel, 'verde')
  })
})

describe('formato inválido: nunca se repara', () => {
  for (const [entrada, motivo] of [
    ['wwww.tikt0ok.-com', 'mal armado'],
    ["wwww.tikt'ok.-com", 'caracteres que no pueden ir'],
    ['https://google.com%40evil.com', 'No se puede leer'],
  ]) {
    test(`${JSON.stringify(entrada)} imita una marca: queda sin verificar y en Sospechoso`, () => {
      const resultado = analizar(entrada)
      assert.equal(resultado.nivel, 'amarillo')
      assert.equal(resultado.sinVerificar, true)
      assert.equal(resultado.motivos[0], SIN_FORMATO)
      assert.ok(resultado.motivos[1].includes(motivo), resultado.motivos[1])
    })
  }

  for (const [entrada, motivo] of [
    ['sitio..com', 'mal armado'],
    ['-banco.com', 'mal armado'],
    ['exa_mple.com', 'caracteres que no pueden ir'],
    ['hola', 'forma de un sitio'],
    ['localhost:3000', 'forma de un sitio'],
    ['ejemplo.c0m', 'extensión que no existe'],
    ['ejemplo.cosa', 'extensión que no existe'],
    ['co.uk', 'solo una extensión'],
    ['http://', 'No se puede leer'],
    ['https://xn--zz.com', 'No se puede leer'],
    ['https://google.com:99999', 'No se puede leer'],
    ['goo gle.com', 'espacios'],
    ['https://goo\u200bgle.com', 'invisibles'],
    ['https://goo\ngle.com', 'saltos de línea'],
    ['https://goo\tgle.com', 'espacios'],
  ]) {
    test(JSON.stringify(entrada), () => {
      const resultado = noVerificado(entrada)
      if (motivo) {
        assert.equal(resultado.motivos[0], SIN_FORMATO)
        assert.ok(resultado.motivos[1].includes(motivo), resultado.motivos[1])
      }
    })
  }

  test('el carácter invisible no se borra para analizar lo que queda', () => {
    const lectura = leerEnlace('https://goo\u200bgle.com')
    assert.equal(lectura.estado, 'invalido')
  })

  test('un texto con esquema que no se puede leer no recibe otro https://', () => {
    assert.equal(leerEnlace('https://google.com%40evil.com').host, 'google.com%40evil.com')
  })

  test('los espacios de los bordes, que quedan al pegar, no cuentan', () => {
    assert.equal(leerEnlace('  https://google.com\n').href, 'https://google.com/')
  })

  test('vacío no es un enlace', () => {
    assert.equal(analizar(''), null)
    assert.equal(analizar('   '), null)
  })
})

describe('esquema', () => {
  test('sin esquema se lee como https', () => {
    const lectura = leerEnlace('ejemplo.com/promo')
    assert.equal(lectura.estado, 'web')
    assert.equal(lectura.href, 'https://ejemplo.com/promo')
  })

  test('host con puerto sin esquema', () => {
    const lectura = leerEnlace('ejemplo.com:8080/x')
    assert.equal(lectura.host, 'ejemplo.com')
    assert.equal(lectura.puerto, '8080')
  })

  for (const [entrada, esquema] of [
    ['javascript:alert(1)', 'javascript'],
    ['JavaScript:alert(1)', 'javascript'],
    ['data:text/html,<b>hola</b>', 'data'],
    ['file:///C:/Windows/system32', 'file'],
    ['vbscript:msgbox(1)', 'vbscript'],
  ]) {
    test(`${esquema}: es peligroso`, () => {
      const resultado = analizar(entrada)
      assert.equal(resultado.nivel, 'rojo')
      assert.equal(resultado.sinSitio, true)
      assert.ok(resultado.motivos[0].includes(`${esquema}:`))
    })
  }

  test('otro esquema no se puede verificar', () => {
    for (const entrada of ['mailto:alguien@ejemplo.com', 'ftp://sitio.com', 'intent://abrir#Intent;end']) {
      const resultado = noVerificado(entrada)
      assert.ok(resultado.motivos[0].includes('otra aplicación'))
    }
  })
})

describe('host', () => {
  test('wwww. suma y no se toma como www.', () => {
    const resultado = analizar('wwww.google.com')
    assert.equal(resultado.nivel, 'amarillo')
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('"wwww."')))
  })

  test('mayúsculas: el host se compara en minúscula y el camino se respeta', () => {
    const lectura = leerEnlace('HTTPS://GOOGLE.COM/Ruta')
    assert.equal(lectura.host, 'google.com')
    assert.equal(lectura.url.pathname, '/Ruta')
    assert.equal(analizar('HTTPS://GOOGLE.COM/Ruta').nivel, 'verde')
  })

  test('punto final: mismo dominio, la dirección no se toca', () => {
    const lectura = leerEnlace('https://google.com./')
    assert.equal(lectura.puntoFinal, true)
    assert.equal(lectura.dominio, 'google.com')
    assert.equal(lectura.href, 'https://google.com./')
  })

  test('puertos: el de siempre no suma, uno raro sí', () => {
    assert.equal(analizar('https://ejemplo.com:443/').puntuacion, 0)
    assert.ok(analizar('https://ejemplo.com:3000/').motivos.some((motivo) => motivo.includes('puerto 3000')))
  })

  test('userinfo: el host real es el que va después de la arroba', () => {
    const resultado = analizar('https://google.com@evil.com')
    assert.equal(resultado.host, 'evil.com')
    assert.equal(resultado.dominio, 'evil.com')
    assert.equal(resultado.nivel, 'rojo')
    assert.ok(resultado.motivos[0].includes('(google.com)'))
  })

  test('barra invertida: se juzga el host que abre el navegador', () => {
    const resultado = analizar('https://evil.com\\@google.com')
    assert.equal(resultado.host, 'evil.com')
    assert.equal(resultado.nivel, 'rojo')
  })

  test('percent-encoding en el host se marca como disfrazado', () => {
    const resultado = analizar('https://%65vil-ejemplo.com/')
    assert.equal(resultado.host, 'evil-ejemplo.com')
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('escrito disfrazado')))
  })

  test('percent-encoding en el camino no cambia el host', () => {
    assert.equal(analizar('https://ejemplo.com/a%20b').host, 'ejemplo.com')
  })

  for (const [entrada, forma] of [
    ['http://0x7f000001', 'hexadecimal'],
    ['http://2130706433', 'numero'],
    ['http://0177.0.0.1', 'octal'],
  ]) {
    test(`IP escrita ${forma}`, () => {
      const lectura = leerEnlace(entrada)
      assert.equal(lectura.tipoHost, 'ipv4')
      assert.equal(lectura.host, '127.0.0.1')
      assert.equal(lectura.formaIp, forma)
      assert.equal(analizar(entrada).nivel, 'rojo')
    })
  }

  test('IP común e IPv6', () => {
    assert.equal(leerEnlace('http://192.168.0.1/').formaIp, null)
    assert.ok(analizar('https://192.168.0.1/').motivos[0].includes('dirección IP'))
    assert.equal(leerEnlace('http://[::1]/').tipoHost, 'ipv6')
  })

  test('subdominios de más', () => {
    assert.equal(leerEnlace('a.b.c.d.e.ejemplo.com').subdominios, 5)
    assert.ok(analizar('a.b.c.d.e.ejemplo.com').motivos.some((motivo) => motivo.includes('subdominios')))
  })
})

describe('IDN, punycode y alfabetos', () => {
  test('punycode y unicode llegan al mismo host', () => {
    assert.equal(leerEnlace('xn--80ak6aa92e.com').host, 'xn--80ak6aa92e.com')
    assert.equal(leerEnlace('аррӏе.com').host, 'xn--80ak6aa92e.com')
    assert.equal(leerEnlace('xn--80ak6aa92e.com').hostUnicode, 'аррӏе.com')
  })

  test('letras cirílicas que imitan a Apple es rojo', () => {
    assert.equal(analizar('xn--80ak6aa92e.com').nivel, 'rojo')
  })

  test('mezcla de cirílico y latino', () => {
    assert.equal(leerEnlace('pаypal.com').mezclaAlfabetos, true)
    assert.equal(analizar('pаypal.com').nivel, 'rojo')
    assert.ok(analizar('bаnquito-ejemplo.com').motivos.some((motivo) => motivo.includes('Mezcla letras')))
  })

  test('todo en cirílico imitando latinas, sin marca', () => {
    assert.equal(leerEnlace('сосо.com').imitaLatinas, true)
    assert.notEqual(analizar('сосо.com').nivel, 'verde')
  })

  test('un dominio con ñ no es sospechoso por eso', () => {
    const resultado = analizar('españa.com')
    assert.equal(resultado.nivel, 'verde')
    assert.equal(leerEnlace('españa.com').mezclaAlfabetos, false)
  })

  test('letras de ancho completo se marcan si no es el sitio oficial', () => {
    assert.ok(analizar('ｅｊｅｍｐｌｏ-raro.com').motivos.some((motivo) => motivo.includes('escrito disfrazado')))
  })
})

describe('direcciones muy largas', () => {
  test('pasar el máximo deja el resultado sin verificar, con motivo', () => {
    const entrada = `https://ejemplo.com/${'a'.repeat(LARGO_MAXIMO)}`
    const resultado = noVerificado(entrada)
    assert.equal(resultado.demasiadoLarga, true)
    assert.ok(resultado.motivos.some((motivo) => motivo.includes('muy larga')))
  })

  test('las señales fuertes se mantienen aunque sea larga', () => {
    assert.equal(analizar(`https://g0ogle.xyz/${'a'.repeat(LARGO_MAXIMO)}`).nivel, 'rojo')
  })
})
