export function datoSafeLink({ total = 0, peligrosos = 0 } = {}) {
  if (!total) return 'Todavía no revisaste nada'
  const revisiones = total === 1 ? '1 revisión' : `${total} revisiones`
  if (!peligrosos) return `${revisiones} · ningún engaño por ahora`
  const enganos = peligrosos === 1 ? '1 engaño frenado' : `${peligrosos} engaños frenados`
  return `${revisiones} · ${enganos}`
}

export function datoPhishGuard(tablero) {
  if (!tablero) return ''
  const correos = tablero.eventos?.length ?? 0
  const campanas = tablero.campanas?.length ?? 0
  if (campanas === 0) return 'Todavía no armaste ninguna campaña'
  const enCampanas = campanas === 1 ? '1 campaña' : `${campanas} campañas`
  if (correos === 0) return `${enCampanas} · todavía no salió ningún correo`
  const clics = tablero.eventos.filter((evento) => evento.hizo_clic).length
  return `${enCampanas} · ${Math.round((clics / correos) * 100)} % tocó el enlace`
}
