import { leerLista, guardarJson } from './guardadoLocal.js'

const CLAVE = 'sg-lista-seguridad'

export const TAREAS = [
  {
    id: 'whatsapp',
    titulo: 'Verificación en dos pasos de WhatsApp',
    como: 'En WhatsApp: Ajustes › Cuenta › Verificación en dos pasos. Elegí un PIN que no sea tu fecha de nacimiento.',
  },
  {
    id: 'correo',
    titulo: 'Verificación en dos pasos del correo',
    como: 'En Gmail: tu foto › Gestionar tu cuenta de Google › Seguridad › Verificación en 2 pasos.',
  },
  {
    id: 'banco',
    titulo: 'Revisar los dispositivos del banco y la billetera',
    como: 'En la app, buscá la sección Seguridad y cerrá las sesiones o dispositivos que no reconozcas.',
  },
  {
    id: 'bloqueo',
    titulo: 'Bloqueo de pantalla en el celular',
    como: 'En Ajustes › Seguridad › Bloqueo de pantalla. Usá un PIN o tu huella, no un dibujo fácil.',
  },
  {
    id: 'portapapeles',
    titulo: 'Aviso de enlaces copiados en SafeGuard',
    como: 'Te ofrecemos revisar lo que copiás al abrir la app. Se activa en Perfil.',
    automatica: true,
  },
  {
    id: 'safeguard',
    titulo: 'Verificación en dos pasos de SafeGuard',
    como: 'En Perfil › Seguridad, con una app de códigos.',
  },
]

export function leerHechas(almacen) {
  return leerLista(CLAVE, almacen).filter((id) => TAREAS.some((tarea) => tarea.id === id))
}

export function guardarHechas(hechas, almacen) {
  return guardarJson(CLAVE, hechas, almacen)
}

export function estadoLista(hechas, { portapapeles = false } = {}) {
  const marcadas = new Set(hechas)
  if (portapapeles) marcadas.add('portapapeles')
  const tareas = TAREAS.map((tarea) => ({ ...tarea, hecha: marcadas.has(tarea.id) }))
  const listas = tareas.filter((tarea) => tarea.hecha).length
  return { tareas, listas, total: TAREAS.length, completa: listas === TAREAS.length }
}
