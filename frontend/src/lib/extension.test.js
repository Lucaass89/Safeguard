import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizar } from './analisis.js'
import {
  debeAbrir,
  estadoDe,
  esPagina,
  indiceDeAmenazas,
  listaVigente,
  MAX_MOTIVOS,
  peorAmenaza,
  recordar,
  urlParaAbrir,
} from './extension.js'
import { SIN_ABRIR, SIN_BASE } from './veredicto.js'

const HORA = 60 * 60 * 1000

test('solo las páginas http y https se revisan', () => {
  assert.equal(esPagina('https://www.google.com/'), true)
  assert.equal(esPagina('http://ejemplo.com'), true)
  assert.equal(esPagina('chrome://extensions'), false)
  assert.equal(esPagina('no es una url'), false)
})

test('una página verde no sale de la compu', () => {
  const local = analizar('https://www.google.com/buscar?q=algo')
  assert.equal(local.nivel, 'verde')
  assert.equal(debeAbrir(local), false)
  assert.equal(urlParaAbrir(local), null)
})

test('una página roja o un acortador se abren para confirmarlos, sin la parte después de #', () => {
  assert.equal(urlParaAbrir(analizar('https://bna-acceso.com/clave#token=123')), 'https://bna-acceso.com/clave')
  assert.equal(debeAbrir(analizar('https://bit.ly/3xQpaRk')), true)
})

test('la lista de amenazas vale por 6 horas', () => {
  const ahora = 1_000_000_000_000
  assert.equal(listaVigente({ filas: [], guardadaEn: ahora - 5 * HORA }, ahora), true)
  assert.equal(listaVigente({ filas: [], guardadaEn: ahora - 7 * HORA }, ahora), false)
  assert.equal(listaVigente({ filas: [], guardadaEn: ahora + HORA }, ahora), false)
  assert.equal(listaVigente(null, ahora), false)
  assert.equal(listaVigente({ guardadaEn: ahora }, ahora), false)
})

test('el índice se queda con el peor nivel de cada dominio e ignora filas raras', () => {
  const indice = indiceDeAmenazas([
    { dominio: 'Trucho.com', nivel: 'amarillo', veces_reportado: 1 },
    { dominio: 'trucho.com', nivel: 'rojo', veces_reportado: 3 },
    { dominio: 'sinpunto', nivel: 'rojo' },
    { dominio: 'raro.com', nivel: 'verde' },
    null,
  ])
  assert.equal(indice.size, 1)
  assert.equal(indice.get('trucho.com').nivel, 'rojo')
  assert.equal(indice.get('trucho.com').veces_reportado, 3)
})

test('peorAmenaza busca en todos los dominios del recorrido', () => {
  const indice = indiceDeAmenazas([
    { dominio: 'medio.com', nivel: 'amarillo' },
    { dominio: 'final.com', nivel: 'rojo' },
  ])
  assert.equal(peorAmenaza(indice, ['limpio.com', 'medio.com', 'final.com']).nivel, 'rojo')
  assert.equal(peorAmenaza(indice, ['limpio.com', undefined]), null)
})

test('un dominio denunciado en la base sale rojo aunque la dirección parezca normal', () => {
  const local = analizar('https://promo-del-dia.com.ar/')
  const indice = indiceDeAmenazas([{ dominio: 'promo-del-dia.com.ar', nivel: 'rojo', veces_reportado: 2 }])
  const estado = estadoDe(local, { indice })
  assert.equal(estado.nivel, 'rojo')
  assert.ok(estado.motivos[0].includes('denunciado en la base de SafeLink (2 veces)'))
})

test('si no se pudo bajar la lista, el estado lo dice', () => {
  const estado = estadoDe(analizar('https://www.google.com/'), { indice: null })
  assert.ok(estado.motivos.includes(SIN_BASE))
})

test('si se intentó abrir y no respondió, el estado lo dice', () => {
  const estado = estadoDe(analizar('https://bna-acceso.com/clave'), { indice: new Map(), intentoAbrir: true })
  assert.ok(estado.motivos.includes(SIN_ABRIR))
  assert.equal(estado.nivel, 'rojo')
})

test('el estado trae nivel, dominio, qué hacer y como mucho cuatro motivos', () => {
  const estado = estadoDe(analizar('https://bna-acceso.com/clave'), { indice: new Map(), aviso: 'x' })
  assert.equal(estado.nivel, 'rojo')
  assert.equal(estado.dominio, 'bna-acceso.com')
  assert.ok(estado.hacer.startsWith('No lo abras'))
  assert.ok(estado.motivos.length <= MAX_MOTIVOS)
  assert.equal(estado.aviso, 'x')
})

test('recordar guarda las últimas y descarta las más viejas', () => {
  const mapa = new Map()
  recordar(mapa, 'a', 1, 2)
  recordar(mapa, 'b', 2, 2)
  recordar(mapa, 'a', 3, 2)
  recordar(mapa, 'c', 4, 2)
  assert.deepEqual([...mapa.keys()], ['a', 'c'])
  assert.equal(mapa.get('a'), 3)
})
