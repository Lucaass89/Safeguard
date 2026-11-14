import { enlaceAlPanel } from './detector.js'

const NOMBRES = {
  verde: 'Verde: no aparecen señales de riesgo',
  amarillo: 'Amarillo: hay algo raro',
  rojo: 'Rojo: no lo abras',
  gris: 'Gris: no lo podemos revisar',
  neutro: 'Sin revisión',
}

const caja = document.querySelector('#resultado')
const nivelTexto = document.querySelector('#nivel-texto')
const dominio = document.querySelector('#dominio')
const motivos = document.querySelector('#motivos')
const hacer = document.querySelector('#hacer')
const aviso = document.querySelector('#aviso')
const completo = document.querySelector('#completo')
const avisar = document.querySelector('#avisar')

function mostrar(estado) {
  const nivel = estado?.nivel && NOMBRES[estado.nivel] ? estado.nivel : 'neutro'
  caja.className = nivel
  nivelTexto.textContent = NOMBRES[nivel]
  dominio.hidden = !estado?.dominio
  dominio.textContent = estado?.dominio ?? ''
  motivos.replaceChildren()
  const frases = estado?.motivos ?? []
  motivos.hidden = frases.length === 0
  for (const frase of frases) {
    const item = document.createElement('li')
    item.textContent = frase
    motivos.append(item)
  }
  hacer.textContent = estado?.hacer ?? 'SafeLink está mirando esta pestaña.'
  aviso.hidden = !estado?.aviso
  aviso.textContent = estado?.aviso ?? ''
  completo.hidden = nivel === 'neutro' || !estado?.url
  if (!completo.hidden) completo.href = enlaceAlPanel(estado.url)
}

chrome.runtime.sendMessage({ tipo: 'actual' }, mostrar)

chrome.storage.sync.get('avisar').then(({ avisar: activo = true }) => {
  avisar.checked = activo
})

avisar.addEventListener('change', () => {
  chrome.storage.sync.set({ avisar: avisar.checked })
})
