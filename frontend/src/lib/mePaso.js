export const SITUACIONES = [
  {
    id: 'clave',
    titulo: 'Puse mi clave o los datos de la tarjeta',
    pasos: [
      'Llamá ya a tu banco al número que figura atrás de la tarjeta y pedí que la bloqueen.',
      'Cambiá la clave desde la app oficial, entrando vos. Si usás esa clave en otros lados, cambiala también.',
      'Revisá los últimos movimientos y desconocé los que no hiciste.',
      'Activá la verificación en dos pasos en tu banco y en tu correo.',
    ],
  },
  {
    id: 'codigo',
    titulo: 'Pasé un código que me llegó por SMS o WhatsApp',
    pasos: [
      'Si era de WhatsApp, abrilo y volvé a verificar tu número: el código nuevo te llega a vos y saca a la otra persona.',
      'Activá la verificación en dos pasos de WhatsApp en Ajustes › Cuenta.',
      'Avisá a tus contactos que no respondan pedidos de plata que lleguen desde tu número.',
      'Si el código era de tu banco o billetera, llamalos ya y contales qué pasó.',
    ],
  },
  {
    id: 'plata',
    titulo: 'Transferí plata',
    pasos: [
      'Llamá ya a tu banco o billetera y pedí que intenten frenar la transferencia. Cuanto antes, mejor.',
      'Guardá capturas del chat, el comprobante y los datos de la cuenta a la que mandaste.',
      'Hacé la denuncia en la comisaría o en la fiscalía. En muchas provincias se puede hacer en línea.',
      'Si el banco no te responde, podés reclamar en el Banco Central, en usuariosfinancieros.gob.ar.',
    ],
  },
  {
    id: 'app',
    titulo: 'Instalé una app o abrí un archivo que me mandaron',
    pasos: [
      'Poné el celular en modo avión para cortar la conexión.',
      'Desinstalá la app. Si no te deja, buscala en Ajustes › Aplicaciones y en Ajustes › Accesibilidad.',
      'Desde otro dispositivo, cambiá las claves del banco y del correo.',
      'Si seguís viendo cosas raras, llevá el celular a un service de confianza.',
    ],
  },
]

export function situacion(id) {
  return SITUACIONES.find((item) => item.id === id) ?? null
}
