import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase.js'
import './Panel.css'
import './PanelDarkconsole.css'

const CANALES = [
  { id: 'whatsapp', etiqueta: 'WhatsApp' },
  { id: 'sms', etiqueta: 'SMS' },
  { id: 'email', etiqueta: 'Mail' },
]

function etiquetaCanal(canal) {
  return CANALES.find((item) => item.id === canal)?.etiqueta ?? canal
}

function Estado({ hecho, si, no }) {
  return <span className={hecho ? 'dc-estado dc-estado-si' : 'dc-estado dc-estado-no'}>{hecho ? si : no}</span>
}

function Area({ area, elegidos, onArea, onPersona }) {
  const caja = useRef(null)
  const ids = area.personas.map((persona) => persona.id)
  const marcadas = ids.filter((id) => elegidos.includes(id)).length

  useEffect(() => {
    if (caja.current) caja.current.indeterminate = marcadas > 0 && marcadas < ids.length
  }, [marcadas, ids.length])

  return (
    <section className="dc-bloque">
      <label className="dc-check dc-check-area">
        <input
          ref={caja}
          type="checkbox"
          checked={ids.length > 0 && marcadas === ids.length}
          onChange={() => onArea(ids)}
        />
        <span>{area.nombre}</span>
      </label>
      <ul className="dc-personas">
        {area.personas.map((persona) => (
          <li key={persona.id}>
            <label className="dc-check">
              <input
                type="checkbox"
                checked={elegidos.includes(persona.id)}
                onChange={() => onPersona(persona.id)}
              />
              <span>{persona.nombre}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Marca({ dominio }) {
  if (!dominio) return null
  return <p className="dc-marca">Marcada por SafeLink · {dominio}</p>
}

function Resultado({ ultimo }) {
  if (!ultimo) {
    return <p className="panel-vacio">Todavía no lanzaste un simulacro.</p>
  }

  return (
    <div className="dc-resultado">
      <p className="dc-resultado-nombre">{ultimo.nombre}</p>
      <p className="dc-resultado-meta">
        {etiquetaCanal(ultimo.canal)}
        {ultimo.plantilla ? ` · ${ultimo.plantilla}` : ''}
      </p>
      <Marca dominio={ultimo.amenaza_dominio} />
      {ultimo.personas.length === 0 ? (
        <p className="panel-vacio">Este simulacro no tiene personas.</p>
      ) : (
        <ul className="dc-lista">
          {ultimo.personas.map((persona) => (
            <li key={persona.id}>
              <p className="dc-lista-nombre">{persona.nombre}</p>
              <p className="dc-lista-area">{persona.area}</p>
              <ul className="dc-estados">
                <li>
                  <Estado hecho={persona.abrio} si="Abrió" no="No abrió" />
                </li>
                <li>
                  <Estado hecho={persona.clic} si="Hizo clic" no="No hizo clic" />
                </li>
                <li>
                  <Estado hecho={persona.datos} si="Cargó datos" no="No cargó datos" />
                </li>
                <li>
                  <Estado hecho={persona.explicacion} si="Vio la explicación" no="No vio la explicación" />
                </li>
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PanelDarkconsole() {
  const [consola, setConsola] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [canal, setCanal] = useState('whatsapp')
  const [plantillaId, setPlantillaId] = useState('')
  const [nombre, setNombre] = useState('')
  const [elegidos, setElegidos] = useState([])
  const [lanzando, setLanzando] = useState(false)

  async function leer() {
    const { data, error: fallo } = await supabase.rpc('phishguard_darkconsole')
    if (fallo) return { error: fallo.message }
    return { consola: data }
  }

  useEffect(() => {
    let activo = true
    leer().then((estado) => {
      if (!activo) return
      setConsola(estado.consola ?? null)
      setError(estado.error ?? null)
      setCargando(false)
    })
    return () => {
      activo = false
    }
  }, [])

  const plantillas = consola?.plantillas ?? []
  const visibles = useMemo(
    () => plantillas.filter((plantilla) => plantilla.canal === canal || plantilla.canal === 'todos'),
    [plantillas, canal],
  )
  const elegida = visibles.find((plantilla) => plantilla.id === plantillaId) ?? null

  function alternarPersona(id) {
    setElegidos((previo) => (previo.includes(id) ? previo.filter((item) => item !== id) : [...previo, id]))
  }

  function alternarArea(ids) {
    setElegidos((previo) => {
      const todas = ids.every((id) => previo.includes(id))
      if (todas) return previo.filter((id) => !ids.includes(id))
      return [...new Set([...previo, ...ids])]
    })
  }

  async function actualizar() {
    setError(null)
    const estado = await leer()
    if (estado.error) {
      setError(estado.error)
      return
    }
    setConsola(estado.consola)
  }

  async function lanzar(evento) {
    evento.preventDefault()
    setError(null)
    setAviso(null)
    if (elegidos.length === 0) {
      setError('Elegí un área o al menos una persona.')
      return
    }

    const areasMarcadas = (consola?.areas ?? [])
      .filter((area) => area.personas.some((persona) => elegidos.includes(persona.id)))
      .map((area) => area.nombre)

    setLanzando(true)
    const { data, error: fallo } = await supabase.rpc('phishguard_darkconsole_lanzar', {
      p_nombre: nombre.trim(),
      p_canal: canal,
      p_plantilla: plantillaId,
      p_area: areasMarcadas.length === 1 ? areasMarcadas[0] : '',
      p_empleados: elegidos,
    })

    if (fallo || !data?.campana_id) {
      setLanzando(false)
      setError(fallo?.message ?? 'No se pudo lanzar el simulacro.')
      return
    }

    const { data: mail, error: falloMail } = await supabase.functions.invoke('phishguard-avisar-campana', {
      body: { campana_id: data.campana_id, origen: window.location.origin },
    })

    const estado = await leer()
    setLanzando(false)
    setNombre('')
    setElegidos([])
    setPlantillaId('')
    if (estado.consola) setConsola(estado.consola)

    if (mail?.ok === true) {
      setAviso(mail.aviso ?? 'El kit, con el mensaje y el enlace de cada persona, llegó a tu correo.')
      return
    }

    setError(
      `El simulacro quedó creado. El kit no salió por correo: ${mail?.error || falloMail?.message || 'no se pudo enviar'}. Los enlaces quedan en Campañas.`,
    )
  }

  if (cargando) return <p className="panel-estado">Abriendo Darkconsole…</p>

  if (!consola?.encargado) {
    return (
      <div className="panel panel-empresas">
        <header className="panel-header">
          <Link className="panel-volver" to="/panel?app=phishguard">
            ← Volver a las opciones
          </Link>
          <h1>Darkconsole</h1>
          <p className="panel-lead">Con esta cuenta no se puede lanzar nada.</p>
        </header>
        {error && <p className="panel-error">{error}</p>}
      </div>
    )
  }

  const areas = consola.areas ?? []
  const empresa = consola.organizacion?.nombre_empresa || 'Tu empresa'

  return (
    <div className="panel panel-empresas">
      <header className="panel-header">
        <Link className="panel-volver" to="/panel?app=phishguard">
          ← Volver a las opciones
        </Link>
        <p className="dc-kicker">Darkconsole</p>
        <h1>{empresa}</h1>
        <p className="panel-lead">
          Si alguien cae, hay una explicación. No hay sanción ni exposición, y el empleado no entra a esta consola.
        </p>
      </header>

      {error && <p className="panel-error">{error}</p>}
      {aviso && <p className="panel-aviso">{aviso}</p>}

      {areas.length === 0 ? (
        <p className="panel-vacio">
          No hay personas activas. <Link to="/panel/empresa">Cargalas en Tu empresa</Link>.
        </p>
      ) : (
        <form className="panel-form panel-pieza" onSubmit={lanzar}>
          <fieldset className="panel-campo dc-areas">
            <legend>Áreas</legend>
            {areas.map((area) => (
              <Area
                key={area.nombre}
                area={area}
                elegidos={elegidos}
                onArea={alternarArea}
                onPersona={alternarPersona}
              />
            ))}
          </fieldset>

          <label className="panel-campo">
            <span>Canal</span>
            <select
              value={canal}
              onChange={(evento) => {
                setCanal(evento.target.value)
                setPlantillaId('')
              }}
            >
              {CANALES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="panel-campo">
            <span>Plantilla</span>
            <select value={plantillaId} onChange={(evento) => setPlantillaId(evento.target.value)} required>
              <option value="">Elegí una</option>
              {visibles.map((plantilla) => (
                <option key={plantilla.id} value={plantilla.id}>
                  {plantilla.amenaza_dominio ? `Marcada por SafeLink · ${plantilla.amenaza_dominio} · ` : ''}
                  {plantilla.titulo}
                </option>
              ))}
            </select>
          </label>
          <Marca dominio={elegida?.amenaza_dominio} />

          <label className="panel-campo">
            <span>Nombre</span>
            <input
              type="text"
              value={nombre}
              maxLength={120}
              onChange={(evento) => setNombre(evento.target.value)}
              required
            />
          </label>

          <button type="submit" className="panel-boton" disabled={lanzando || visibles.length === 0}>
            {lanzando ? 'Lanzando…' : 'Lanzar'}
          </button>
          {visibles.length === 0 && <p className="panel-vacio">No hay plantillas para este canal.</p>}
        </form>
      )}

      <section className="panel-seccion" aria-labelledby="dc-ultimo">
        <div className="dc-ultimo-cabeza">
          <h2 id="dc-ultimo">Último simulacro</h2>
          <button type="button" className="panel-boton panel-boton-borde" onClick={actualizar}>
            Actualizar
          </button>
        </div>
        <Resultado ultimo={consola.ultimo} />
      </section>
    </div>
  )
}

export default PanelDarkconsole
