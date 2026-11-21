import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import postgres from 'npm:postgres'
import {
  leerPersonas,
  personasDeReferencia,
  PERSONAS_PRECIO_ANTERIOR,
  PRECIO_ANTERIOR,
  precioPesos,
  referencia,
} from './precio.ts'

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

async function tokenMercadoPago() {
  const desdeEntorno = (
    Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ??
    Deno.env.get('MP_ACCESS_TOKEN') ??
    ''
  ).trim()
  if (desdeEntorno) return desdeEntorno

  const dbUrl = Deno.env.get('SUPABASE_DB_URL')
  if (!dbUrl) return ''

  const sql = postgres(dbUrl, { prepare: false, max: 1, connect_timeout: 10 })
  try {
    const filas = await sql<{ decrypted_secret: string }[]>`
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'mercado_pago_access_token'
      limit 1
    `
    return (filas[0]?.decrypted_secret ?? '').trim()
  } catch {
    return ''
  } finally {
    await sql.end({ timeout: 2 })
  }
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

function clienteAdmin() {
  const url = Deno.env.get('SUPABASE_URL')
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !servicio) return null
  return createClient(url, servicio)
}

async function guardarSolicitud(usuarioId: string, empresa: unknown) {
  const admin = clienteAdmin()
  if (!admin) return { error: 'No se pudieron guardar los datos de la empresa.' }
  const { data, error } = await admin.rpc('phishguard_empresa_normalizada', { p_datos: empresa })
  if (error) return { error: error.message || 'Los datos de la empresa no son válidos.' }
  const { error: errorGuardar } = await admin
    .from('phishguard_solicitudes')
    .upsert({ auth_user_id: usuarioId, datos: data, actualizado_en: new Date().toISOString() })
  if (errorGuardar) return { error: 'No se pudieron guardar los datos de la empresa.' }
  return { error: null }
}

async function crearCobro(usuarioId: string, token: string, personas: number, ref: string) {
  const vuelta = `${SITIO}/adquirir/vuelta`
  const monto = precioPesos(personas)
  const respuesta = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: `PhishGuard para ${personas} ${personas === 1 ? 'persona' : 'personas'}`,
          description: 'Un solo cobro en pesos por el primer mes del plan elegido.',
          quantity: 1,
          currency_id: MONEDA,
          unit_price: monto,
        },
      ],
      external_reference: ref,
      back_urls: {
        success: vuelta,
        pending: vuelta,
        failure: vuelta,
      },
      auto_return: 'approved',
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

function personasPagadas(pago: Record<string, unknown>, usuarioId: string): number | null {
  if (pago.status !== 'approved' || pago.currency_id !== MONEDA) return null
  const personas = personasDeReferencia(pago.external_reference, usuarioId)
  if (personas === null) return null
  const esperado = pago.external_reference === usuarioId ? PRECIO_ANTERIOR : precioPesos(personas)
  return Number(pago.transaction_amount) === esperado ? personas : null
}

async function buscarPagoAprobado(usuarioId: string, token: string, personas: number | null) {
  const referencias = personas ? [referencia(usuarioId, personas), usuarioId] : [usuarioId]
  for (const ref of referencias) {
    const pago = await buscarConReferencia(ref, usuarioId, token)
    if (pago) return pago
  }
  return null
}

async function buscarConReferencia(ref: string, usuarioId: string, token: string) {
  const busqueda = new URL('https://api.mercadopago.com/v1/payments/search')
  busqueda.searchParams.set('external_reference', ref)
  busqueda.searchParams.set('status', 'approved')
  busqueda.searchParams.set('sort', 'date_created')
  busqueda.searchParams.set('criteria', 'desc')
  busqueda.searchParams.set('limit', '20')

  const respuesta = await fetch(busqueda, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!respuesta.ok) return null

  const cuerpo = await respuesta.json()
  const pagos: Record<string, unknown>[] = Array.isArray(cuerpo?.results) ? cuerpo.results : []
  return pagos.find((pago) => personasPagadas(pago, usuarioId) !== null) ?? null
}

async function desbloquear(usuarioId: string, pagoMp: string, personas: number, monto: number) {
  const url = Deno.env.get('SUPABASE_URL')
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !servicio) {
    throw new Error('No se pudo guardar el pago.')
  }

  const admin = createClient(url, servicio)
  const { data: solicitud } = await admin
    .from('phishguard_solicitudes')
    .select('datos')
    .eq('auth_user_id', usuarioId)
    .maybeSingle()
  const empresa = solicitud?.datos as Record<string, unknown> | undefined

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
        nombre_empresa:
          typeof empresa?.nombre_empresa === 'string' ? empresa.nombre_empresa : 'Prueba PhishGuard',
        plan_id: 'Inicial',
        estado_suscripcion: 'activa',
        usuarios_contratados: personas,
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
      .update({ estado_suscripcion: 'activa', usuarios_contratados: personas })
      .eq('id', organizacionId)
    if (errorEstado) throw new Error('No se pudo abrir PhishGuard.')
  }

  if (empresa) {
    const { error: errorEmpresa } = await admin.rpc('phishguard_aplicar_empresa', {
      p_org: organizacionId,
      p_datos: empresa,
    })
    if (!errorEmpresa) {
      await admin.from('phishguard_solicitudes').delete().eq('auth_user_id', usuarioId)
    }
  }

  const { error: errorPago } = await admin.from('pagos_phishguard').insert({
    auth_user_id: usuarioId,
    organizacion_id: organizacionId,
    medio: 'mercado_pago',
    monto,
    moneda: MONEDA,
    es_prueba: false,
    pago_mp: pagoMp,
    personas,
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

  const token = await tokenMercadoPago()
  if (!token) {
    return json(
      { error: 'Falta la credencial de Mercado Pago para armar el cobro.' },
      503,
    )
  }

  let cuerpo: { accion?: string; pago_id?: string; personas?: unknown; empresa?: unknown } = {}
  try {
    cuerpo = await req.json()
  } catch {
    return json({ error: 'No entendí el pedido.' }, 400)
  }

  if (cuerpo.accion === 'crear') {
    if (cuerpo.empresa !== undefined) {
      const { error } = await guardarSolicitud(usuario.id, cuerpo.empresa)
      if (error) return json({ error }, 400)
    }
    if (cuerpo.personas === undefined) {
      return await crearCobro(usuario.id, token, PERSONAS_PRECIO_ANTERIOR, usuario.id)
    }
    const personas = leerPersonas(cuerpo.personas)
    if (personas === null) {
      return json({ error: 'Elegí cuántas personas va a cubrir el plan, de 1 a 10.000.' }, 400)
    }
    return await crearCobro(usuario.id, token, personas, referencia(usuario.id, personas))
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

    const personas = personasPagadas(pago, usuario.id)
    if (personas === null) {
      return json({ estado: 'rechazado' })
    }

    try {
      await desbloquear(usuario.id, pagoId, personas, Number(pago.transaction_amount))
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo abrir PhishGuard.'
      return json({ error: mensaje }, 500)
    }

    return json({ estado: 'aprobado' })
  }

  if (cuerpo.accion === 'verificar') {
    const pago = await buscarPagoAprobado(usuario.id, token, leerPersonas(cuerpo.personas))
    const personas = pago ? personasPagadas(pago, usuario.id) : null
    if (!pago || personas === null) return json({ estado: 'sin_pago' })

    try {
      await desbloquear(usuario.id, String(pago.id), personas, Number(pago.transaction_amount))
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo abrir PhishGuard.'
      return json({ error: mensaje }, 500)
    }

    return json({ estado: 'aprobado' })
  }

  return json({ error: 'No entendí el pedido.' }, 400)
})
