import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cuentaDeServicio, enviarAvisos } from './fcm.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ESPERA_MINUTOS = 10

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const autorizacion = req.headers.get('Authorization') ?? ''
  const publica = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
  const comoUsuario = createClient(url, publica, {
    global: { headers: { Authorization: autorizacion } },
  })
  const { data: quien } = await comoUsuario.auth.getUser()
  const usuarioId = quien?.user?.id
  if (!usuarioId) return json({ ok: false }, 401)

  let analisisId = ''
  try {
    const body = await req.json()
    analisisId = typeof body?.analisis_id === 'string' ? body.analisis_id : ''
  } catch {
    analisisId = ''
  }
  if (!/^[0-9a-f-]{36}$/i.test(analisisId)) return json({ ok: false }, 400)

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const desde = new Date(Date.now() - ESPERA_MINUTOS * 60000).toISOString()

  const { data: analisis } = await admin
    .from('safelink_analisis')
    .select('id, dominio, nivel_riesgo, fecha_analisis')
    .eq('id', analisisId)
    .eq('usuario_id', usuarioId)
    .eq('nivel_riesgo', 'rojo')
    .gte('fecha_analisis', desde)
    .maybeSingle()
  if (!analisis) return json({ ok: true, aviso: 'nada' })

  const { data: vinculos } = await admin
    .from('familia_vinculos')
    .select('cuidador_id, ultimo_aviso')
    .eq('cuidado_id', usuarioId)
  const cuidadores = (vinculos ?? [])
    .filter((fila) => !fila.ultimo_aviso || new Date(fila.ultimo_aviso) < new Date(desde))
    .map((fila) => fila.cuidador_id)
  if (cuidadores.length === 0) return json({ ok: true, aviso: 'nada' })

  const cuenta = cuentaDeServicio()
  if (!cuenta) return json({ ok: false, error: 'Falta la cuenta de Firebase' }, 500)

  const { data: celulares } = await admin.from('push_dispositivos').select('token').in('usuario_id', cuidadores)
  const tokens = (celulares ?? []).map((fila) => fila.token)

  const { data: nombre } = await admin.rpc('familia_nombre', { p_usuario: usuarioId })
  const primero = String(nombre ?? 'Tu familiar').trim().split(/\s+/)[0] || 'Tu familiar'
  const dominio = analisis.dominio ? ` (${analisis.dominio})` : ''

  let enviados = 0
  try {
    const resultado = await enviarAvisos(cuenta, tokens, {
      titulo: `Ojo: ${primero} revisó algo peligroso`,
      texto: `SafeLink lo marcó en rojo${dominio}. Puede que le haya llegado un engaño: llamalo para ver si está bien.`,
      ruta: '/perfil/familia',
    })
    enviados = resultado.enviados
    if (resultado.invalidos.length > 0) {
      await admin.from('push_dispositivos').delete().in('token', resultado.invalidos)
    }
  } catch {
    return json({ ok: false }, 502)
  }

  await admin
    .from('familia_vinculos')
    .update({ ultimo_aviso: new Date().toISOString() })
    .eq('cuidado_id', usuarioId)
    .in('cuidador_id', cuidadores)

  return json({ ok: true, aviso: enviados > 0 ? 'enviado' : 'sin celular' })
})
