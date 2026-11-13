import { supabase } from './supabase.js'

const COLUMNAS = 'id, nombre_empresa, tipo_organizacion, cuit, contacto_nombre, contacto_cargo, contacto_email, contacto_telefono'

export async function cargarEmpresaGuardada() {
  const { data: org, error } = await supabase.from('organizaciones').select(COLUMNAS).limit(1).maybeSingle()
  if (error || !org) return { organizacion: null, areas: [] }
  const { data: areas } = await supabase
    .from('areas_empresa')
    .select('nombre')
    .eq('organizacion_id', org.id)
    .order('nombre')
  return { organizacion: org, areas: areas ?? [] }
}
