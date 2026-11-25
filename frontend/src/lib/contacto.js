export const CONTACTO = {
  correo: 'contacto@gmail.com',
  whatsapp: '+54 9 11 1234-5678',
}

export function numeroWhatsapp(numero) {
  return String(numero ?? '').replace(/\D/g, '')
}

export function enlaceWhatsapp(texto = '', numero = CONTACTO.whatsapp) {
  const base = `https://wa.me/${numeroWhatsapp(numero)}`
  const limpio = String(texto).trim()
  return limpio ? `${base}?text=${encodeURIComponent(limpio)}` : base
}

export function enlaceCorreo(asunto = '', correo = CONTACTO.correo) {
  const limpio = String(asunto).trim()
  return limpio ? `mailto:${correo}?subject=${encodeURIComponent(limpio)}` : `mailto:${correo}`
}

export const MOTIVOS_CONTACTO = [
  {
    id: 'phishguard',
    titulo: 'Quiero PhishGuard para mi organización',
    texto: 'Contanos cuántas personas son y por dónde se comunican, y te ayudamos a armar la primera campaña.',
    mensaje: 'Hola, quiero saber más sobre PhishGuard para mi organización.',
    pagina: { ruta: '/empresas', texto: 'Ver PhishGuard' },
  },
  {
    id: 'problema',
    titulo: 'Tengo un problema con SafeLink o la app',
    texto: 'Decinos qué estabas haciendo y qué pasó. Si podés, sumá una captura.',
    mensaje: 'Hola, tengo un problema con SafeLink.',
    pagina: { ruta: '/personas', texto: 'Ver SafeLink' },
  },
  {
    id: 'sospechoso',
    titulo: 'Me llegó algo sospechoso',
    texto: 'Revisalo primero con SafeLink: te dice el color y el motivo al instante. Si te sigue haciendo ruido, escribinos.',
    mensaje: 'Hola, me llegó algo sospechoso y quiero consultarlo.',
    pagina: { ruta: '/personas', texto: 'Revisarlo con SafeLink' },
  },
]
