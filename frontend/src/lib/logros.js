export function calcularLogros({ peligrosos = 0, total = 0, mejorRacha = 0, listaCompleta = false, lecciones = 0 }) {
  return [
    { id: 'primera', titulo: 'Primera revisión', icono: '🔎', logrado: total >= 1 },
    { id: 'freno', titulo: 'Frenaste un engaño', icono: '🛑', logrado: peligrosos >= 1 },
    { id: 'diez', titulo: '10 revisiones', icono: '🧭', logrado: total >= 10 },
    { id: 'racha', titulo: '5 bien seguidas', icono: '🔥', logrado: mejorRacha >= 5 },
    { id: 'lecciones', titulo: '3 lecciones', icono: '📘', logrado: lecciones >= 3 },
    { id: 'lista', titulo: 'Cuentas cuidadas', icono: '🛡️', logrado: listaCompleta },
  ]
}

export function resumenLogros(logros) {
  const hechos = logros.filter((logro) => logro.logrado).length
  return `${hechos} de ${logros.length} logros`
}
