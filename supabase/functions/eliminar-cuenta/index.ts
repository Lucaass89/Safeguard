import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AVISO_UNICO_ADMIN =
  'Sos el único administrador de tu empresa. Asigná a otra persona como administrador antes de eliminar tu cuenta.'

function esAdministrador(rol: string | null) {
  return typeof rol === 'string' && rol.toLowerCase().startsWith('admin')
}

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405)
  }

  const autorizacion = req.headers.get('Authorization')
  if (!autorizacion) {
    return json({ error: 'Tenés que iniciar sesión' }, 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !servicio) {
    return json({ error: 'No se pudo eliminar la cuenta' }, 500)
  }

  const comoUsuario = createClient(url, anon, {
    global: { headers: { Authorization: autorizacion } },
  })
  const { data, error } = await comoUsuario.auth.getUser()
  if (error || !data.user) {
    return json({ error: 'Tenés que iniciar sesión' }, 401)
  }

  const admin = createClient(url, servicio)
  const { data: membresia, error: errorMembresia } = await admin
    .from('usuarios_admin')
    .select('rol, organizacion_id')
    .eq('auth_user_id', data.user.id)
    .maybeSingle()

  if (errorMembresia) {
    return json({ error: 'No se pudo eliminar la cuenta' }, 500)
  }

  if (membresia && esAdministrador(membresia.rol)) {
    const { count, error: errorConteo } = await admin
      .from('usuarios_admin')
      .select('id', { count: 'exact', head: true })
      .eq('organizacion_id', membresia.organizacion_id)
      .ilike('rol', 'admin%')

    if (errorConteo) {
      return json({ error: 'No se pudo eliminar la cuenta' }, 500)
    }

    if (count === 1) {
      return json({ error: AVISO_UNICO_ADMIN, codigo: 'unico_admin' }, 409)
    }
  }

  const { error: fallo } = await admin.auth.admin.deleteUser(data.user.id)
  if (fallo) {
    return json({ error: 'No se pudo eliminar la cuenta' }, 500)
  }

  return json({ ok: true })
})
