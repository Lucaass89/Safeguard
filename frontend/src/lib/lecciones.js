import { guardarJson, leerLista } from './guardadoLocal.js'

const CLAVE = 'sg-lecciones-vistas'

export const LECCIONES = [
  {
    id: 'direccion',
    titulo: 'Cómo leer una dirección',
    partes: [
      'Lo que manda es lo que está justo antes de la primera barra /.',
      'En mercadolibre.com.ar.pagos-seguros.com el sitio real es pagos-seguros.com, no Mercado Libre.',
      'Si dudás, no toques el enlace: entrá escribiendo la dirección vos.',
    ],
  },
  {
    id: 'codigo',
    titulo: 'Nadie te pide un código',
    partes: [
      'Los códigos de 6 números que te llegan por SMS sirven para entrar a tus cuentas.',
      'Ni el banco, ni WhatsApp, ni un familiar necesitan que se los reenvíes.',
      'Si alguien te lo pide, aunque sea por error, es una estafa.',
    ],
  },
  {
    id: 'apuro',
    titulo: 'El apuro es la trampa',
    partes: [
      '"Antes de las 18 h", "tu cuenta será bloqueada", "último aviso": el apuro te hace actuar sin pensar.',
      'Las empresas de verdad te dan tiempo y te avisan por sus canales.',
      'Cuando algo te apura, frená un minuto y preguntá por otro lado.',
    ],
  },
  {
    id: 'qr',
    titulo: 'QR en la calle',
    partes: [
      'Un QR puede llevar a cualquier lado, también a una página falsa.',
      'En carteles y parquímetros, fijate si es una calcomanía pegada encima de otra.',
      'Escanealo con SafeGuard: te dice adónde lleva antes de abrirlo.',
    ],
  },
  {
    id: 'familiar',
    titulo: 'El familiar con número nuevo',
    partes: [
      'Un número desconocido dice ser tu hijo, tu mamá o un amigo, y te pide plata.',
      'Siempre hay una excusa: "se me rompió el celular", "es urgente".',
      'Llamá al número de siempre o preguntá algo que solo esa persona sepa.',
    ],
  },
]

export function leerVistas(almacen) {
  return leerLista(CLAVE, almacen).filter((id) => LECCIONES.some((leccion) => leccion.id === id))
}

export function marcarVista(vistas, id, almacen) {
  if (vistas.includes(id)) return vistas
  const nuevas = [...vistas, id]
  guardarJson(CLAVE, nuevas, almacen)
  return nuevas
}

export function ordenarLecciones(vistas) {
  return [...LECCIONES].sort((a, b) => Number(vistas.includes(a.id)) - Number(vistas.includes(b.id)))
}
