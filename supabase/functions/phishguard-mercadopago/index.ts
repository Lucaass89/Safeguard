import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PRECIO = 500
const MONEDA = 'ARS'
const SITIO = 'https://safeguardd.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function tokenMercadoPago() {
  return (
    Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ??
    Deno.env.get('MP_ACCESS_TOKEN') ??
    ''
  ).trim()
}

function esCheckoutReal(valor: string) {
  try {
    const url = new URL(valor)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'www.mercadopago.com.ar' || url.hostname === 'www.mercadopago.com')
    )
  } catch {
    return false
  }
}

async function usuarioDe(autorizacion: string) {
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anon) return null

  const cliente = createClient(url, anon, {
    global: { headers: { Authorization: autorizacion } },
  })
  const { data, error } = await cliente.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

async function crearCobro(usuarioId: string, token: string) {
  const vuelta = `${SITIO}/adquirir/vuelta`
  const respuesta = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: 'PhishGuard',
          description: 'Plan de PhishGuard',
          quantity: 1,
          currency_id: MONEDA,
          unit_price: PRECIO,
        },
      ],
      external_reference: usuarioId,
      back_urls: {
        success: vuelta,
        pending: vuelta,
        failure: vuelta,
      },
      auto_return: 'approved',
      statement_descriptor: 'PHISHGUARD',
      binary_mode: true,
    }),
  })

  if (respuesta.status === 401 || respuesta.status === 403) {
    return json({ error: 'La credencial de Mercado Pago no sirve para cobrar.' }, 502)
  }

  if (!respuesta.ok) {
    return json({ error: 'Mercado Pago no pudo armar el cobro.' }, 502)
  }

  const preferencia = await respuesta.json()
  const destino = typeof preferencia.init_point === 'string' ? preferencia.init_point : ''
  if (!esCheckoutReal(destino)) {
    return json({ error: 'Mercado Pago no devolvió el checkout real.' }, 502)
  }

  return json({ url: destino })
}

async function leerPago(pagoId: string, token: string) {
  const respuesta = await fetch(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!respuesta.ok) return null
  return await respuesta.json()
}

function pagoValido(pago: Record<string, unknown>, usuarioId: string) {
  const monto = Number(pago.transaction_amount)
  return (
    pago.status === 'approved' &&
    pago.currency_id === MONEDA &&
    monto === PRECIO &&
    pago.external_reference === usuarioId
  )
}

async function desbloquear(usuarioId: string, pagoMp: string) {
  const url = Deno.env.get('SUPABASE_URL')
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !servicio) {
    throw new Error('No se pudo guardar el pago.')
  }

  const admin = createClient(url, servicio)
  const { data: ya } = await admin
    .from('pagos_phishguard')
    .select('id')
    .eq('pago_mp', pagoMp)
    .maybeSingle()
  if (ya) return

  const { data: cuenta, error: errorCuenta } = await admin.auth.admin.getUserById(usuarioId)
  const email = cuenta?.user?.email ?? ''
  if (errorCuenta || !email) {
    throw new Error('No encontré la cuenta del pago.')
  }

  const { data: membresia } = await admin
    .from('usuarios_admin')
    .select('organizacion_id')
    .eq('auth_user_id', usuarioId)
    .maybeSingle()

  let organizacionId = membresia?.organizacion_id as string | undefined
  if (!organizacionId) {
    const { data: org, error: errorOrg } = await admin
      .from('organizaciones')
      .insert({
        nombre_empresa: 'Prueba PhishGuard',
        plan_id: 'Inicial',
        estado_suscripcion: 'activa',
      })
      .select('id')
      .single()
    if (errorOrg || !org) throw new Error('No se pudo abrir PhishGuard.')
    organizacionId = org.id

    const { error: errorAdmin } = await admin.from('usuarios_admin').insert({
      organizacion_id: organizacionId,
      auth_user_id: usuarioId,
      nombre: email.split('@')[0],
      email,
      rol: 'Admin_Principal',
    })
    if (errorAdmin) throw new Error('No se pudo abrir PhishGuard.')
  } else {
    const { error: errorEstado } = await admin
      .from('organizaciones')
      .update({ estado_suscripcion: 'activa' })
      .eq('id', organizacionId)
    if (errorEstado) throw new Error('No se pudo abrir PhishGuard.')
  }

  const { error: errorPago } = await admin.from('pagos_phishguard').insert({
    auth_user_id: usuarioId,
    organizacion_id: organizacionId,
    medio: 'mercado_pago',
    monto: PRECIO,
    moneda: MONEDA,
    es_prueba: false,
    pago_mp: pagoMp,
  })
  if (errorPago && errorPago.code !== '23505') {
    throw new Error('No se pudo guardar el pago.')
  }
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
    return json({ error: 'Tenés que entrar para pagar.' }, 401)
  }

  const usuario = await usuarioDe(autorizacion)
  if (!usuario) {
    return json({ error: 'Tenés que entrar para pagar.' }, 401)
  }

  const token = tokenMercadoPago()
  if (!token) {
    return json(
      { error: 'Falta la credencial de Mercado Pago para armar el cobro.' },
      503,
    )
  }

  let cuerpo: { accion?: string; pago_id?: string } = {}
  try {
    cuerpo = await req.json()
  } catch {
    return json({ error: 'No entendí el pedido.' }, 400)
  }

  if (cuerpo.accion === 'crear') {
    return await crearCobro(usuario.id, token)
  }

  if (cuerpo.accion === 'confirmar') {
    const pagoId = typeof cuerpo.pago_id === 'string' ? cuerpo.pago_id : ''
    if (!/^\d{1,20}$/.test(pagoId)) {
      return json({ error: 'Mercado Pago no informó un pago.' }, 400)
    }

    const pago = await leerPago(pagoId, token)
    if (!pago) {
      return json({ error: 'No pude confirmar el pago en Mercado Pago.' }, 502)
    }

    if (pago.status === 'pending' || pago.status === 'in_process') {
      return json({ estado: 'pendiente' })
    }

    if (!pagoValido(pago, usuario.id)) {
      return json({ estado: 'rechazado' })
    }

    try {
      await desbloquear(usuario.id, pagoId)
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo abrir PhishGuard.'
      return json({ error: mensaje }, 500)
    }

    return json({ estado: 'aprobado' })
  }

  return json({ error: 'No entendí el pedido.' }, 400)
})
