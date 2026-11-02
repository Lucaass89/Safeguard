const PLURAL = { Enlace: 'enlaces', QR: 'QR', Mensaje: 'mensajes', PDF: 'PDF', Correo: 'correos' }

function dia(fecha) {
  const d = new Date(fecha)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Junta lo que se revisó más de una vez el mismo día con el mismo resultado; el más nuevo representa al grupo.
export function agruparActividad(items, maximo = 5) {
  const grupos = []
  const porClave = new Map()
  for (const item of items) {
    const clave = [item.tipo, item.texto, item.nivel, dia(item.fecha)].join('|')
    const grupo = porClave.get(clave)
    if (grupo) {
      grupo.veces += 1
    } else if (grupos.length < maximo) {
      const nuevo = { ...item, veces: 1 }
      porClave.set(clave, nuevo)
      grupos.push(nuevo)
    }
  }
  return grupos
}

export function detalleDe(item) {
  return item.veces > 1 ? `${item.veces} ${PLURAL[item.tipo] ?? 'revisiones'}` : item.tipo
}
