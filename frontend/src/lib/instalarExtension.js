import tiempos from '../data/instalarExtension.json' with { type: 'json' }

export const DURACION = tiempos.duracion

const TEXTOS = [
  ['descargar', 'Descargá la extensión', 'Tocá Descargar la extensión. Se baja el archivo safelink.zip.'],
  ['descomprimir', 'Descomprimí el archivo', 'En Windows: clic derecho y Extraer todo. En Mac: doble clic.'],
  ['abrir', 'Abrí las extensiones de Chrome', 'Escribí chrome://extensions en la barra de direcciones.'],
  ['modo', 'Activá el modo de desarrollador', 'Es el interruptor de arriba a la derecha.'],
  ['cargar', 'Cargá la carpeta', 'Tocá Cargar descomprimida y elegí la carpeta safelink.'],
  ['fijar', 'Fijala en la barra', 'Tocá la pieza de rompecabezas y el alfiler de SafeLink.'],
]

export const PASOS_INSTALAR = TEXTOS.map(([id, titulo, texto]) => ({
  id,
  titulo,
  texto,
  inicio: tiempos.inicios[id],
}))
