import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analizar } from './analisis.js'
import { cbuValido, crc16, leerQr, leerTlv } from './qrContenido.js'

const dato = (resultado, clave) => resultado.datos.find(([nombre]) => nombre === clave)?.[1]

function tlv(id, valor) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

function pago(campos) {
  const sinControl = `${campos.join('')}6304`
  return sinControl + crc16(sinControl)
}

describe('contenido completo', () => {
  test('todo resultado guarda el texto tal cual vino', () => {
    for (const texto of ['https://ejemplo.com.ar/a?b=1', 'WIFI:S:Casa;T:WPA;P:clave;;', 'hola, ¿todo bien?', 'market://details?id=x']) {
      assert.equal(leerQr(texto).crudo, texto)
    }
  })
})

describe('direcciones web', () => {
  test('una URL pasa por el mismo motor que un enlace pegado', () => {
    const leido = leerQr('https://tikt0ok.com/login')
    assert.equal(leido.tipo, 'web')
    assert.deepEqual(leido.local, analizar('https://tikt0ok.com/login'))
  })

  test('un texto con un enlace adentro no se revisa solo, pero ofrece revisarlo', () => {
    const leido = leerQr('Escaneá y entrá a https://promo-ejemplo.com/premio para cobrar')
    assert.equal(leido.tipo, 'texto')
    assert.equal(leido.enlace, 'https://promo-ejemplo.com/premio')
    assert.ok(leido.avisos.length > 0)
  })
})

describe('Wi-Fi', () => {
  test('muestra el nombre y la seguridad, nunca conecta', () => {
    const leido = leerQr('WIFI:T:WPA;S:Casa\\;Lopez;P:secreta;H:true;;')
    assert.equal(leido.tipo, 'wifi')
    assert.equal(dato(leido, 'Red'), 'Casa;Lopez')
    assert.equal(dato(leido, 'Seguridad'), 'WPA')
    assert.equal(dato(leido, 'Visibilidad'), 'Red oculta')
    assert.match(leido.consejo, /no se conecta/)
  })

  test('avisa si la red es abierta o usa WEP', () => {
    assert.match(leerQr('WIFI:T:nopass;S:Cafe;;').avisos[0], /red abierta/)
    assert.match(leerQr('WIFI:S:Cafe;;').avisos[0], /red abierta/)
    assert.ok(leerQr('WIFI:T:WEP;S:Vieja;P:123;;').avisos.some((aviso) => aviso.includes('WEP')))
  })

  test('sin nombre de red no se puede verificar', () => {
    assert.equal(leerQr('WIFI:T:WPA;P:x;;').sinVerificar, true)
  })
})

describe('SMS y teléfono', () => {
  test('muestra el número y el texto en las dos formas de SMS', () => {
    const uno = leerQr('SMSTO:+5491122334455:Hola: confirmá tu turno')
    assert.equal(dato(uno, 'Número'), '+5491122334455')
    assert.equal(dato(uno, 'Mensaje'), 'Hola: confirmá tu turno')

    const dos = leerQr('sms:+5491122334455?body=Pag%C3%A1%20ac%C3%A1')
    assert.equal(dato(dos, 'Número'), '+5491122334455')
    assert.equal(dato(dos, 'Mensaje'), 'Pagá acá')
  })

  test('avisa si el número es corto', () => {
    assert.ok(leerQr('SMSTO:22222:ALTA').avisos[0].includes('número corto'))
    assert.equal(dato(leerQr('tel:+541143210000'), 'Número'), '+541143210000')
  })
})

describe('contactos, ubicación y eventos', () => {
  test('lee un vCard con varios datos y ofrece revisar su sitio', () => {
    const leido = leerQr(
      'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ana Pérez\r\nORG:Banco Ejemplo\r\nTEL;TYPE=CELL:+5491100001111\r\nEMAIL:ana@ejemplo.com\r\nURL:https://ejemplo.com\r\nEND:VCARD',
    )
    assert.equal(leido.tipo, 'contacto')
    assert.equal(dato(leido, 'Nombre'), 'Ana Pérez')
    assert.equal(dato(leido, 'Empresa'), 'Banco Ejemplo')
    assert.equal(dato(leido, 'Teléfono'), '+5491100001111')
    assert.equal(leido.enlace, 'https://ejemplo.com')
  })

  test('lee un MECARD', () => {
    const leido = leerQr('MECARD:N:Perez,Ana;TEL:1155556666;EMAIL:ana@ejemplo.com;;')
    assert.equal(dato(leido, 'Nombre'), 'Ana Perez')
    assert.equal(dato(leido, 'Teléfono'), '1155556666')
  })

  test('una ubicación con coordenadas válidas se muestra; una imposible no se verifica', () => {
    const leido = leerQr('geo:-34.6037,-58.3816?q=Obelisco')
    assert.equal(dato(leido, 'Coordenadas'), '-34.6037, -58.3816')
    assert.equal(dato(leido, 'Lugar'), 'Obelisco')
    assert.equal(leerQr('geo:200,10').sinVerificar, true)
  })
})

describe('pagos', () => {
  test('el control del código usa CRC-16/CCITT-FALSE', () => {
    assert.equal(crc16('123456789'), '29B1')
  })

  test('valida los dígitos de un CBU', () => {
    assert.equal(cbuValido('2850590940090418135201'), true)
    assert.equal(cbuValido('2850590940090418135202'), false)
  })

  test('lee receptor, red, cuenta y monto, y aclara que no puede verificar al receptor', () => {
    const codigo = pago([
      tlv('00', '01'),
      tlv('01', '12'),
      tlv('43', tlv('00', 'com.mercadopago') + tlv('01', '2850590940090418135201')),
      tlv('52', '5411'),
      tlv('53', '032'),
      tlv('54', '1500.00'),
      tlv('58', 'AR'),
      tlv('59', 'Kiosco Ejemplo'),
      tlv('60', 'CABA'),
      tlv('62', tlv('05', 'FAC-12')),
    ])
    const leido = leerQr(codigo)
    assert.equal(leido.tipo, 'pago')
    assert.equal(dato(leido, 'Receptor'), 'Kiosco Ejemplo')
    assert.equal(dato(leido, 'Red de cobro'), 'Mercado Pago')
    assert.equal(dato(leido, 'CBU'), '2850590940090418135201')
    assert.equal(dato(leido, 'Monto'), '$ 1500.00')
    assert.equal(dato(leido, 'Referencia'), 'FAC-12')
    assert.deepEqual(leido.avisos, [])
    assert.match(leido.consejo, /no puede verificar a quién le llega la plata/)
  })

  test('avisa si el control no coincide o la cuenta no verifica', () => {
    const codigo = pago([tlv('00', '01'), tlv('26', tlv('00', 'AR.EJEMPLO') + tlv('01', '0000003100000000000002')), tlv('59', 'Otro')])
    const cambiado = codigo.replace('Otro', 'Ajen')
    const leido = leerQr(cambiado)
    assert.ok(leido.avisos.some((aviso) => aviso.includes('no coincide')))
    assert.ok(leido.avisos.some((aviso) => aviso.includes('CVU')))
  })

  test('un pago mal armado no se puede verificar', () => {
    assert.equal(leerTlv('0002019'), null)
    assert.equal(leerQr('000201xx').sinVerificar, true)
  })
})

describe('sin formato reconocible', () => {
  test('un código vacío, binario o de otra app queda en No pudimos verificarlo', () => {
    assert.equal(leerQr('').sinVerificar, true)
    assert.equal(leerQr('\u0001\u0002\uFFFD').sinVerificar, true)
    const app = leerQr('intent://scan/#Intent;scheme=zxing;end')
    assert.equal(app.sinVerificar, true)
    assert.match(app.consejo, /^No pudimos verificarlo/)
  })
})
