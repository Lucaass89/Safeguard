import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function esc(valor: string) {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function origenSeguro(valor: unknown) {
  if (typeof valor !== 'string') return ''
  try {
    const u = new URL(valor)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return ''
    return u.origin
  } catch {
    return ''
  }
}

function clavePublica() {
  const directa =
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
  if (directa) return directa
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}') as Record<
      string,
      string
    >
    return keys.default ?? Object.values(keys)[0] ?? ''
  } catch {
    return ''
  }
}

type Plantilla = {
  titulo?: string | null
  asunto_mail?: string | null
  remitente_falso?: string | null
  cuerpo_html?: string | null
}

function remitenteVisible(plantilla: Plantilla | null) {
  const crudo = (plantilla?.remitente_falso ?? '').trim()
  const nombre = crudo.replaceAll('"', '').trim() || 'Notificaciones'
  return nombre
}

function asuntoCreible(plantilla: Plantilla | null) {
  const asunto = (plantilla?.asunto_mail ?? '').trim()
  return asunto || 'Tenés una notificación pendiente'
}

function correoHtml(plantilla: Plantilla | null, link: string) {
  const crudo = plantilla?.cuerpo_html ?? 'Tenés una notificación pendiente. Ingresá para verla: {link}'
  const boton = `<a href="${esc(link)}" style="display:inline-block;margin:18px 0;padding:12px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px">Ingresar ahora</a>`
  const cuerpo = crudo
    .split('{link}')
    .map((parte) => esc(parte).replaceAll('\n', '<br/>'))
    .join(boton)
  const incluyeBoton = crudo.includes('{link}')
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:28px;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff">
    <p style="margin:0 0 4px">${cuerpo}</p>
    ${incluyeBoton ? '' : boton}
    <p style="margin:24px 0 0;font-size:12px;color:#9aa4b2">Si no esperabas este mensaje, ignoralo.</p>
  </div>`
}

function correoTexto(plantilla: Plantilla | null, link: string) {
  const crudo = plantilla?.cuerpo_html ?? 'Tenés una notificación pendiente. Ingresá para verla: {link}'
  if (crudo.includes('{link}')) return crudo.replaceAll('{link}', link)
  return `${crudo}\n\n${link}`
}

function credencialesGmail() {
  const usuario = (Deno.env.get('GMAIL_USER') ?? '').trim()
  const clave = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replaceAll(/\s/g, '')
  return { usuario, clave }
}

function errorGmail(error: unknown) {
  const crudo = error instanceof Error ? error.message : 'Gmail rechazó el correo'
  if (/535|BadCredentials|Username and Password not accepted|Invalid login/i.test(crudo)) {
    return 'Gmail rechazó la contraseña de aplicación. Revisá GMAIL_USER y GMAIL_APP_PASSWORD en Supabase → Edge Functions → Secrets.'
  }
  return crudo
}

async function mandarGmail(
  from: string,
  to: string,
  subject: string,
  html: string,
  text: string,
  replyTo: string,
) {
  const { usuario, clave } = credencialesGmail()
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: {
        username: usuario,
        password: clave,
      },
    },
  })
  try {
    await client.send({
      from,
      to,
      replyTo,
      subject,
      content: text,
      html,
    })
  } finally {
    await client.close()
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ ok: false, error: 'Tenés que entrar' })

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', clavePublica(), {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: falloUser,
    } = await supabase.auth.getUser()

    if (falloUser || !user?.email) {
      return json({ ok: false, error: 'No hay sesión para saber a quién mandar el correo' })
    }

    const cuerpoReq = await req.json().catch(() => ({}))
    const campanaId = typeof cuerpoReq?.campana_id === 'string' ? cuerpoReq.campana_id : ''
    const origen = origenSeguro(cuerpoReq?.origen)

    if (!campanaId) return json({ ok: false, error: 'Falta la campaña' })
    if (!origen) return json({ ok: false, error: 'Falta la dirección de la app' })

    const { data: campana, error: falloCampana } = await supabase
      .from('campanas')
      .select('id, nombre_campana, canal, plantilla_id')
      .eq('id', campanaId)
      .maybeSingle()

    if (falloCampana || !campana) {
      return json({
        ok: false,
        error: falloCampana?.message ?? 'No se encontró la campaña',
      })
    }

    const [{ data: plantilla }, { data: eventos }] = await Promise.all([
      campana.plantilla_id
        ? supabase
            .from('plantillas_phishing')
            .select('titulo, asunto_mail, remitente_falso, cuerpo_html')
            .eq('id', campana.plantilla_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('eventos_simulacion')
        .select('id, token_unico, empleados(nombre, email)')
        .eq('campana_id', campanaId),
    ])

    const { usuario, clave } = credencialesGmail()
    if (!usuario || !clave) {
      return json({
        ok: false,
        error:
          'Faltan los secretos GMAIL_USER y GMAIL_APP_PASSWORD en Supabase → Edge Functions → Secrets.',
      })
    }

    const personas = (eventos ?? []).map(
      (ev: {
        id: string
        token_unico: string
        empleados: { nombre?: string; email?: string } | null
      }) => {
        const persona = ev.empleados
        return {
          eventoId: ev.id,
          nombre: persona?.nombre ?? 'Empleado',
          email: (persona?.email ?? '').trim(),
          sim: `${origen}/simulacion/${ev.token_unico}`,
          bien: `${origen}/bien/${ev.token_unico}`,
        }
      },
    )

    if (campana.canal === 'email') {
      const conMail = personas.filter((p) => p.email)
      if (conMail.length === 0) {
        return json({ ok: false, error: 'Los empleados de esta campaña no tienen correo cargado.' })
      }

      const asunto = asuntoCreible(plantilla)
      const from = `${remitenteVisible(plantilla)} <${usuario}>`
      let enviados = 0
      let ultimoError = ''
      const enviadosIds: string[] = []

      for (const persona of conMail) {
        try {
          await mandarGmail(
            from,
            persona.email,
            asunto,
            correoHtml(plantilla, persona.sim),
            correoTexto(plantilla, persona.sim),
            usuario,
          )
          enviados += 1
          enviadosIds.push(persona.eventoId)
        } catch (error) {
          ultimoError = errorGmail(error)
          console.log(JSON.stringify({ destino: persona.email, campana: campanaId, ok: false }))
        }
      }

      if (enviadosIds.length > 0) {
        await supabase
          .from('eventos_simulacion')
          .update({ mail_enviado: true })
          .in('id', enviadosIds)
      }

      if (enviados === 0) {
        return json({ ok: false, error: ultimoError || 'No se pudo enviar ningún correo.' })
      }

      console.log(JSON.stringify({ campana: campanaId, enviados, total: conMail.length, ok: true }))
      return json({
        ok: true,
        canal: 'email',
        enviados,
        total: conMail.length,
        aviso:
          enviados === conMail.length
            ? `El correo salió a ${enviados} ${enviados === 1 ? 'empleado' : 'empleados'}.`
            : `El correo salió a ${enviados} de ${conMail.length}. ${ultimoError}`,
      })
    }

    const bloques = personas
      .map(
        (persona) => `<div style="margin:0 0 18px;padding:14px 16px;border:1px solid #e5e7eb;border-radius:10px;font-family:sans-serif;font-size:14px;color:#1f2937">
          <p style="margin:0 0 6px;font-weight:600">${esc(persona.nombre)}${
          persona.email ? ` · <span style="color:#667085;font-weight:400">${esc(persona.email)}</span>` : ''
        }</p>
          <p style="margin:0 0 4px"><strong>Para mandar:</strong> <a href="${esc(persona.sim)}">${esc(persona.sim)}</a></p>
          <p style="margin:0"><strong>Lo hiciste bien:</strong> <a href="${esc(persona.bien)}">${esc(persona.bien)}</a></p>
        </div>`,
      )
      .join('')

    const textoKit = personas
      .map(
        (persona) =>
          `${persona.nombre}${persona.email ? ` (${persona.email})` : ''}\nPara mandar: ${persona.sim}\nLo hiciste bien: ${persona.bien}`,
      )
      .join('\n\n')

    const html = `
      <p style="font-family:sans-serif;font-size:15px;color:#1f2937">Campaña <strong>${esc(campana.nombre_campana)}</strong> por ${esc(campana.canal)}.</p>
      <p style="font-family:sans-serif;font-size:14px;color:#667085">Copiá el enlace de cada persona y mandáselo por el canal de la campaña. El de "lo hiciste bien" es para quien no caiga.</p>
      ${bloques || '<p style="font-family:sans-serif">Sin destinatarios.</p>'}
    `

    const from = `PhishGuard <${usuario}>`
    const asunto = `Kit de campaña: ${campana.nombre_campana}`
    const plano = [
      `Campaña ${campana.nombre_campana} por ${campana.canal}.`,
      'Copiá el enlace de cada persona y mandáselo por el canal de la campaña.',
      '',
      textoKit || 'Sin destinatarios.',
    ].join('\n')

    try {
      await mandarGmail(from, user.email, asunto, html, plano, usuario)
    } catch (error) {
      console.log(JSON.stringify({ destino: user.email, campana: campanaId, ok: false }))
      return json({ ok: false, error: errorGmail(error) })
    }

    console.log(JSON.stringify({ destino: user.email, campana: campanaId, ok: true }))
    return json({
      ok: true,
      canal: campana.canal,
      destino: user.email,
      aviso: `Te mandamos el kit a ${user.email} para enviar por ${campana.canal}.`,
    })
  } catch (error) {
    console.error(error)
    return json({
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo avisar',
    })
  }
})
