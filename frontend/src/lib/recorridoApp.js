export const DURACION = 59.7

export const CAPITULOS = [
  { id: 'qr', titulo: 'Escaneá un QR', texto: 'Apuntás la cámara al cartel y te dice adónde lleva antes de abrirlo.', inicio: 0 },
  { id: 'enlace', titulo: 'Revisá un enlace', texto: 'Pegás la dirección y te da el color, el motivo y qué hacer.', inicio: 9.9 },
  { id: 'mensaje', titulo: 'Revisá un mensaje', texto: 'Lee un WhatsApp o un SMS y marca el engaño.', inicio: 15.9 },
  { id: 'pdf', titulo: 'Revisá un PDF', texto: 'Mira los enlaces que trae adentro antes de que lo abras.', inicio: 23.6 },
  { id: 'faro', titulo: 'Preguntale a Faro', texto: 'Te explica el resultado con palabras simples.', inicio: 29.8 },
  { id: 'ingreso', titulo: 'Ingresá', texto: 'Con Google o con tu correo. Con cuenta guardás tu historial.', inicio: 40.2 },
  { id: 'perfil', titulo: 'Tu perfil', texto: 'Tu actividad, tu seguridad, tus datos y el tema de la app.', inicio: 51.7 },
]

export function capituloEn(tiempo, capitulos = CAPITULOS) {
  if (!Number.isFinite(tiempo) || capitulos.length === 0) return 0
  let indice = 0
  for (let i = 0; i < capitulos.length; i += 1) {
    if (tiempo + 0.05 >= capitulos[i].inicio) indice = i
  }
  return indice
}

export function finDeCapitulo(indice, capitulos = CAPITULOS, duracion = DURACION) {
  return capitulos[indice + 1]?.inicio ?? duracion
}

export function avanceDeCapitulo(tiempo, indice, capitulos = CAPITULOS, duracion = DURACION) {
  const inicio = capitulos[indice]?.inicio
  if (inicio === undefined || !Number.isFinite(tiempo)) return 0
  const largo = finDeCapitulo(indice, capitulos, duracion) - inicio
  if (largo <= 0) return 0
  return Math.min(Math.max((tiempo - inicio) / largo, 0), 1)
}

export function formatoTiempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
