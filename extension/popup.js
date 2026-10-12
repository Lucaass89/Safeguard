const NOMBRES = {
  verde: 'Verde',
  amarillo: 'Amarillo',
  rojo: 'Rojo',
  neutro: 'Sin revisión',
}

const caja = document.querySelector('main')
const nivel = document.querySelector('#nivel')
const dominio = document.querySelector('#dominio')
const motivos = document.querySelector('#motivos')
const hacer = document.querySelector('#hacer')
const aviso = document.querySelector('#aviso')

function mostrar(estado) {
  const color = estado?.nivel && NOMBRES[estado.nivel] ? estado.nivel : 'neutro'
  caja.className = color
  nivel.textContent = NOMBRES[color]
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
}

chrome.runtime.sendMessage({ tipo: 'actual' }, mostrar)
