export const TIPOS_ORGANIZACION = [
  ['pyme', 'PyME'],
  ['educativa', 'Institución educativa'],
]

export const MAX_AREAS = 30

const PREFIJOS_CUIT = ['20', '23', '24', '25', '26', '27', '30', '33', '34']
const PESOS_CUIT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO = /^[0-9+()\-\s]{6,25}$/
const INYECCION = /^[=+\-@]/

function texto(valor) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim()
}

export function limpiarCuit(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

export function cuitValido(valor) {
  const cuit = limpiarCuit(valor)
  if (!/^\d{11}$/.test(cuit)) return false
  if (!PREFIJOS_CUIT.includes(cuit.slice(0, 2))) return false
  const suma = PESOS_CUIT.reduce((total, peso, i) => total + peso * Number(cuit[i]), 0)
  const resto = 11 - (suma % 11)
  const verificador = resto === 11 ? 0 : resto
  if (verificador === 10) return false
  return verificador === Number(cuit[10])
}

export function formatoCuit(valor) {
  const cuit = limpiarCuit(valor)
  if (cuit.length !== 11) return cuit
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
}

export function leerAreas(valor) {
  const lista = Array.isArray(valor) ? valor : String(valor ?? '').split(/[,\n;]/)
  const vistas = new Set()
  const areas = []
  for (const item of lista) {
    const area = texto(item)
    const clave = area.toLowerCase()
    if (!area || vistas.has(clave)) continue
    vistas.add(clave)
    areas.push(area)
  }
  return areas
}

export function validarEmpresa(entrada) {
  const datos = {
    nombre_empresa: texto(entrada?.nombre_empresa),
    tipo_organizacion: texto(entrada?.tipo_organizacion),
    cuit: limpiarCuit(entrada?.cuit),
    contacto_nombre: texto(entrada?.contacto_nombre),
    contacto_cargo: texto(entrada?.contacto_cargo),
    contacto_email: texto(entrada?.contacto_email).toLowerCase().replace(/\s/g, ''),
    contacto_telefono: texto(entrada?.contacto_telefono),
    areas: leerAreas(entrada?.areas),
  }
  const errores = {}

  if (datos.nombre_empresa.length < 2 || datos.nombre_empresa.length > 120) {
    errores.nombre_empresa = 'Escribí el nombre de la empresa, de 2 a 120 caracteres.'
  } else if (INYECCION.test(datos.nombre_empresa)) {
    errores.nombre_empresa = 'El nombre no puede empezar con =, +, - o @.'
  }

  if (!TIPOS_ORGANIZACION.some(([valor]) => valor === datos.tipo_organizacion)) {
    errores.tipo_organizacion = 'Elegí si es una PyME o una institución educativa.'
  }

  if (datos.cuit && !cuitValido(datos.cuit)) {
    errores.cuit = 'El CUIT no es válido. Revisá los 11 números.'
  }

  if (datos.contacto_nombre.length < 2 || datos.contacto_nombre.length > 120) {
    errores.contacto_nombre = 'Escribí el nombre de quien representa a la empresa.'
  } else if (INYECCION.test(datos.contacto_nombre)) {
    errores.contacto_nombre = 'El nombre no puede empezar con =, +, - o @.'
  }

  if (datos.contacto_cargo.length > 80) {
    errores.contacto_cargo = 'El cargo puede tener hasta 80 caracteres.'
  } else if (INYECCION.test(datos.contacto_cargo)) {
    errores.contacto_cargo = 'El cargo no puede empezar con =, +, - o @.'
  }

  if (!CORREO.test(datos.contacto_email) || datos.contacto_email.length > 320) {
    errores.contacto_email = 'Escribí un correo válido, por ejemplo nombre@empresa.com.'
  }

  if (datos.contacto_telefono && !TELEFONO.test(datos.contacto_telefono)) {
    errores.contacto_telefono = 'El teléfono solo puede tener números, espacios, +, - y paréntesis.'
  }

  if (datos.areas.length > MAX_AREAS) {
    errores.areas = `Podés cargar hasta ${MAX_AREAS} áreas.`
  } else if (datos.areas.some((area) => area.length > 60 || INYECCION.test(area))) {
    errores.areas = 'Cada área puede tener hasta 60 caracteres y no puede empezar con =, +, - o @.'
  }

  return { datos, errores, valido: Object.keys(errores).length === 0 }
}

export const EMPRESA_VACIA = {
  nombre_empresa: '',
  tipo_organizacion: '',
  cuit: '',
  contacto_nombre: '',
  contacto_cargo: '',
  contacto_email: '',
  contacto_telefono: '',
  areas: '',
}

export function empresaDesdeOrganizacion(organizacion, areas = [], correoPorDefecto = '') {
  const org = organizacion ?? {}
  const nombre = org.nombre_empresa === 'Prueba PhishGuard' ? '' : org.nombre_empresa
  return {
    nombre_empresa: nombre ?? '',
    tipo_organizacion: org.tipo_organizacion ?? '',
    cuit: org.cuit ? formatoCuit(org.cuit) : '',
    contacto_nombre: org.contacto_nombre ?? '',
    contacto_cargo: org.contacto_cargo ?? '',
    contacto_email: org.contacto_email ?? correoPorDefecto ?? '',
    contacto_telefono: org.contacto_telefono ?? '',
    areas: (areas ?? []).map((area) => (typeof area === 'string' ? area : area?.nombre)).filter(Boolean).join(', '),
  }
}

export function leerBorrador(almacen) {
  try {
    const crudo = (almacen ?? globalThis.sessionStorage)?.getItem('sg-empresa-borrador')
    const datos = crudo ? JSON.parse(crudo) : null
    if (!datos || typeof datos !== 'object') return null
    return Object.fromEntries(Object.keys(EMPRESA_VACIA).map((clave) => [clave, String(datos[clave] ?? '')]))
  } catch {
    return null
  }
}

export function guardarBorrador(valor, almacen) {
  try {
    (almacen ?? globalThis.sessionStorage)?.setItem('sg-empresa-borrador', JSON.stringify(valor))
  } catch {
    void 0
  }
}
