export const SITIO = 'https://safeguard-ar.vercel.app'

const GENERAL = {
  titulo: 'SafeGuard — Protegé el clic. Enseñá en el momento.',
  descripcion:
    'SafeGuard protege a las personas frente a enlaces y códigos QR, y entrena a los equipos con simulaciones de phishing reales de la región.',
}

export const PAGINAS = {
  '/': GENERAL,
  '/personas': {
    titulo: 'SafeLink gratis: revisá un enlace antes de abrirlo — SafeGuard',
    descripcion:
      'Pegá un enlace, un QR, un mensaje de WhatsApp, un correo o un PDF y SafeLink te dice con un color si conviene abrirlo y por qué. Gratis y sin cuenta.',
  },
  '/empresas': {
    titulo: 'PhishGuard: simulaciones de phishing para tu equipo — SafeGuard',
    descripcion:
      'Campañas de phishing simulado para PyMEs e instituciones educativas, con explicación en el momento, tablero e informe. Sin sanciones y sin instalar nada.',
  },
  '/contacto': {
    titulo: 'Contacto — SafeGuard',
    descripcion: 'Escribinos por correo o WhatsApp sobre PhishGuard, SafeLink o algo sospechoso que te llegó.',
  },
  '/terminos': {
    titulo: 'Términos y condiciones — SafeGuard',
    descripcion: 'Las condiciones de uso de SafeLink y PhishGuard contadas en palabras de todos los días.',
  },
  '/privacidad': {
    titulo: 'Privacidad: qué hacemos con los datos — SafeGuard',
    descripcion: 'Qué analiza SafeLink, qué sale de tu navegador, qué se guarda con cuenta y qué registra PhishGuard.',
  },
}

export const PRIVADAS = ['/panel', '/perfil', '/phishguard', '/safelink', '/simulacion', '/bien', '/c', '/ingresar', '/adquirir']

export function normalizarRuta(ruta) {
  const limpia = String(ruta ?? '/').split(/[?#]/)[0].replace(/\/+$/, '')
  return limpia === '' ? '/' : limpia
}

export function esPrivada(ruta) {
  const limpia = normalizarRuta(ruta)
  return PRIVADAS.some((base) => limpia === base || limpia.startsWith(`${base}/`))
}

export function metaDe(ruta) {
  const limpia = normalizarRuta(ruta)
  const pagina = PAGINAS[limpia] ?? GENERAL
  return {
    ...pagina,
    canonica: `${SITIO}${PAGINAS[limpia] ? (limpia === '/' ? '/' : limpia) : '/'}`,
    indexar: !esPrivada(limpia),
  }
}

export function sitemap(fecha) {
  const filas = Object.keys(PAGINAS).map(
    (ruta) =>
      `  <url>\n    <loc>${SITIO}${ruta}</loc>\n    <lastmod>${fecha}</lastmod>\n    <priority>${ruta === '/' ? '1.0' : '0.8'}</priority>\n  </url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${filas.join('\n')}\n</urlset>\n`
}

export function robots() {
  const reglas = PRIVADAS.map((ruta) => `Disallow: ${ruta}/`)
  return ['User-agent: *', 'Allow: /', ...reglas, '', `Sitemap: ${SITIO}/sitemap.xml`, ''].join('\n')
}
