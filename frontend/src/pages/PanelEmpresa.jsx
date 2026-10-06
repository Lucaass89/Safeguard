import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { analizarCsv, decodificarCsv, LIMITE_BYTES, plantillaCsv, reporteErrores } from '../lib/csvPersonas.js'
import { supabase } from '../lib/supabase.js'
import { useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './Panel.css'

async function cargar() {
  const { data: orgs, error: falloOrg } = await supabase
    .from('organizaciones')
    .select('id, nombre_empresa, plan_id, estado_suscripcion')
    .limit(1)

  if (falloOrg) {
    return { organizacion: null, empleados: [], error: falloOrg.message }
  }

  const org = orgs?.[0] ?? null
  if (!org) return { organizacion: null, empleados: [], error: null }

  const { data: personas, error: falloEmp } = await supabase
    .from('empleados')
    .select('id, nombre, email, departamento, estado, origen')
    .order('creado_en', { ascending: false })

  return {
    organizacion: org,
    empleados: personas ?? [],
    error: falloEmp ? falloEmp.message : null,
  }
}

function descargarTexto(nombre, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

function dominioDe(correo) {
  const limpio = (correo ?? '').trim().toLowerCase()
  const corte = limpio.lastIndexOf('@')
  return corte === -1 ? '' : limpio.slice(corte + 1)
}

function esAdministrador(rol) {
  return typeof rol === 'string' && rol.toLowerCase().startsWith('admin')
}

const ESTADOS = [
  ['activo', 'Activo'],
  ['inactivo', 'Inactivo'],
  ['pendiente_verificacion', 'Pendiente de verificación'],
  ['pendiente_aprobacion', 'Pendiente de aprobación'],
  ['rechazado', 'Rechazado'],
]

const ORIGENES = [
  ['manual', 'Manual'],
  ['csv', 'CSV'],
  ['link', 'Link'],
]

function etiqueta(opciones, valor) {
  return opciones.find(([clave]) => clave === valor)?.[1] ?? valor
}

function claseEstado(estado) {
  if (estado === 'activo') return 'persona-badge persona-badge-activo'
  if (estado === 'rechazado') return 'persona-badge persona-badge-rechazado'
  if (estado === 'pendiente_aprobacion') return 'persona-badge persona-badge-aprobacion'
  if (estado === 'pendiente_verificacion') return 'persona-badge persona-badge-verificacion'
  if (estado === 'inactivo') return 'persona-badge persona-badge-inactivo'
  return 'persona-badge'
}

function ImportarCsv({ empleados, correoAdmin, alTerminar }) {
  const archivoRef = useRef(null)
  const [abierto, setAbierto] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [leyendo, setLeyendo] = useState(false)
  const [importando, setImportando] = useState(false)
  const [error, setError] = useState(null)
  const [vista, setVista] = useState(null)
  const [autoriza, setAutoriza] = useState(false)
  const [creaAreas, setCreaAreas] = useState(false)
  const [resultado, setResultado] = useState(null)

  function limpiarVista() {
    setVista(null)
    setAutoriza(false)
    setCreaAreas(false)
    setResultado(null)
  }

  async function leerArchivo(archivo) {
    setError(null)
    setResultado(null)
    setAutoriza(false)
    setCreaAreas(false)
    if (!archivo) return
    const tipo = archivo.type
    const nombre = archivo.name.toLowerCase()
    const pareceCsv = nombre.endsWith('.csv') || tipo === 'text/csv' || tipo === 'text/plain' || tipo === 'application/vnd.ms-excel' || tipo === ''
    if (!pareceCsv) {
      setVista(null)
      setError('Elegí un archivo CSV.')
      return
    }
    if (archivo.size > LIMITE_BYTES) {
      setVista(null)
      setError('El archivo pesa más de 2 MB. Achicalo o partilo.')
      return
    }

    setLeyendo(true)
    try {
      const decodificado = decodificarCsv(await archivo.arrayBuffer())
      if (decodificado.error) {
        setVista(null)
        setError(decodificado.error)
        return
      }
      const analisis = analizarCsv(decodificado.texto, {
        correos: empleados.map((persona) => persona.email),
        areas: empleados.map((persona) => persona.departamento),
        dominios: [dominioDe(correoAdmin), ...empleados.map((persona) => dominioDe(persona.email))],
      })
      if (analisis.error) {
        setVista(null)
        setError(analisis.error)
        return
      }
      setVista(analisis)
    } catch {
      setVista(null)
      setError('No pudimos leer el archivo.')
    } finally {
      setLeyendo(false)
      if (archivoRef.current) archivoRef.current.value = ''
    }
  }

  async function confirmar() {
    if (!vista || !autoriza || importando) return
    if (vista.areasNuevas.length > 0 && !creaAreas) return
    if (vista.validas.length === 0) return

    setImportando(true)
    setError(null)
    const { data, error: fallo } = await supabase.rpc('phishguard_importar_empleados', {
      p_filas: vista.validas.map((fila) => ({
        nombre: fila.nombre,
        correo: fila.correo,
        area: fila.area,
      })),
    })
    setImportando(false)
    if (fallo) {
      setError(fallo.message || 'No se pudo importar el archivo.')
      return
    }
    setResultado({
      cargadas: data?.cargadas ?? 0,
      omitidas: data?.omitidas ?? 0,
      errores: data?.errores ?? 0,
    })
    setVista(null)
    await alTerminar()
  }

  if (!abierto) {
    return (
      <button type="button" className="panel-boton-borde" onClick={() => setAbierto(true)}>
        Importar desde CSV
      </button>
    )
  }

  const primeras = vista?.filas.slice(0, 8) ?? []
  const puedeConfirmar = Boolean(
    vista && autoriza && vista.validas.length > 0 && (vista.areasNuevas.length === 0 || creaAreas) && !importando,
  )

  return (
    <div className="csv-panel">
      <div className="panel-acciones">
        <button type="button" className="panel-boton-borde" onClick={() => descargarTexto('plantilla-personas.csv', plantillaCsv())}>
          Descargar plantilla
        </button>
        <button type="button" className="panel-boton-borde" onClick={() => { setAbierto(false); limpiarVista(); setError(null) }}>
          Cerrar
        </button>
      </div>
      <p className="csv-ayuda">Columnas: nombre, correo y area. Area es opcional. Podés separar con coma o con punto y coma.</p>

      <div
        className={arrastrando ? 'csv-zona csv-zona-activa' : 'csv-zona'}
        onDragOver={(evento) => {
          evento.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(evento) => {
          evento.preventDefault()
          setArrastrando(false)
          leerArchivo(evento.dataTransfer.files?.[0])
        }}
      >
        <p>{leyendo ? 'Leyendo el archivo…' : 'Arrastrá el CSV acá.'}</p>
        <button type="button" className="panel-boton-borde" onClick={() => archivoRef.current?.click()} disabled={leyendo || importando}>
          Elegir archivo
        </button>
        <input
          ref={archivoRef}
          className="csv-input"
          type="file"
          accept=".csv,text/csv"
          onChange={(evento) => leerArchivo(evento.target.files?.[0])}
        />
      </div>

      {error && <p className="panel-error" role="alert">{error}</p>}
      {leyendo && <p className="panel-estado" aria-live="polite">Leyendo el archivo…</p>}

      {vista && (
        <div className="csv-vista" aria-live="polite">
          <p className="csv-resumen">
            {vista.validas.length} {vista.validas.length === 1 ? 'válida' : 'válidas'}
            {' · '}
            {vista.duplicadas} {vista.duplicadas === 1 ? 'duplicada' : 'duplicadas'}
            {' · '}
            {vista.invalidas.length} {vista.invalidas.length === 1 ? 'inválida' : 'inválidas'}
          </p>
          {vista.filas.some((fila) => fila.aviso) && (
            <p className="panel-aviso">
              Hay correos de otro dominio. No bloquean la carga: una empresa puede usar más de uno.
            </p>
          )}
          {vista.filas.length === 0 ? (
            <p className="panel-vacio">El archivo no tiene personas.</p>
          ) : (
            <div className="csv-tabla-wrap">
              <table className="csv-tabla">
                <caption>Primeras filas del archivo</caption>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Área</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {primeras.map((fila) => (
                    <tr key={fila.fila}>
                      <td>{fila.fila}</td>
                      <td>{fila.nombre || '—'}</td>
                      <td>{fila.correo || '—'}</td>
                      <td>{fila.area}</td>
                      <td>{fila.motivo || fila.aviso || 'Lista para cargar'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {vista.filas.length > primeras.length && (
            <p className="csv-ayuda">Mostrando {primeras.length} de {vista.filas.length} filas.</p>
          )}
          {(vista.invalidas.length > 0 || vista.duplicadas > 0) && (
            <button
              type="button"
              className="panel-boton-borde"
              onClick={() => descargarTexto('errores-importacion.csv', reporteErrores(vista.filas))}
            >
              Descargar reporte de errores
            </button>
          )}
          {vista.areasNuevas.length > 0 && (
            <label className="csv-check">
              <input type="checkbox" checked={creaAreas} onChange={(evento) => setCreaAreas(evento.target.checked)} />
              <span>Crear estas áreas nuevas: {vista.areasNuevas.join(', ')}.</span>
            </label>
          )}
          {vista.validas.length === 0 ? (
            <p className="panel-vacio">No hay personas nuevas para cargar.</p>
          ) : (
            <>
              <label className="csv-check">
                <input type="checkbox" checked={autoriza} onChange={(evento) => setAutoriza(evento.target.checked)} />
                <span>Confirmo que tengo autorización de mi empresa para incluir a estas personas en el programa de concientización.</span>
              </label>
              <button type="button" className="panel-boton" disabled={!puedeConfirmar} onClick={confirmar}>
                {importando ? 'Cargando las personas…' : `Cargar ${vista.validas.length} ${vista.validas.length === 1 ? 'persona' : 'personas'}`}
              </button>
            </>
          )}
        </div>
      )}

      {importando && !vista && <p className="panel-estado" aria-live="polite">Cargando las personas…</p>}
      {resultado && (
        <p className="panel-aviso" aria-live="polite">
          Cargadas: {resultado.cargadas}. Omitidas por duplicado: {resultado.omitidas}. Con error: {resultado.errores}.
        </p>
      )}
    </div>
  )
}

function PanelEmpresa() {
  const { sesion } = useSesion()
  const { rol, cargando: cargandoMembresia } = useMembresia()
  const [organizacion, setOrganizacion] = useState(null)
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [area, setArea] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroOrigen, setFiltroOrigen] = useState('todos')
  const [filtroArea, setFiltroArea] = useState('todas')
  const [elegidos, setElegidos] = useState([])
  const [resolviendo, setResolviendo] = useState([])
  const [avisoLista, setAvisoLista] = useState(null)

  useEffect(() => {
    let activo = true
    cargar().then((estado) => {
      if (!activo) return
      setOrganizacion(estado.organizacion)
      setEmpleados(estado.empleados)
      if (estado.error) setError(estado.error)
      setCargando(false)
    })
    return () => {
      activo = false
    }
  }, [])

  async function agregarEmpleado(evento) {
    evento.preventDefault()
    setError(null)

    const { data, error: fallo } = await supabase
      .from('empleados')
      .insert({
        organizacion_id: organizacion.id,
        nombre: nombre.trim(),
        email: correo.trim().toLowerCase(),
        departamento: area.trim() || 'General',
      })
      .select('id, nombre, email, departamento, estado, origen')
      .single()

    if (fallo) {
      setError(
        fallo.code === '23505'
          ? 'Ese correo ya está cargado en tu empresa.'
          : `No se pudo agregar: ${fallo.message}`,
      )
      return
    }

    setEmpleados((previo) => [data, ...previo])
    setNombre('')
    setCorreo('')
    setArea('')
  }

  async function quitarEmpleado(id) {
    setError(null)
    const { error: fallo } = await supabase.from('empleados').delete().eq('id', id)
    if (fallo) setError(`No se pudo quitar: ${fallo.message}`)
    else {
      setEmpleados((previo) => previo.filter((e) => e.id !== id))
      setElegidos((previo) => previo.filter((item) => item !== id))
    }
  }

  const areas = useMemo(() => {
    const nombres = empleados.map((persona) => persona.departamento || 'General')
    return [...new Set(nombres)].sort((a, b) => a.localeCompare(b, 'es'))
  }, [empleados])

  const pendientes = empleados.filter((persona) => persona.estado === 'pendiente_aprobacion')
  const vistaPendientes = filtroEstado === 'pendiente_aprobacion' && filtroOrigen === 'todos' && filtroArea === 'todas'
  const visibles = empleados.filter((persona) => {
    if (filtroEstado !== 'todos' && persona.estado !== filtroEstado) return false
    if (filtroOrigen !== 'todos' && (persona.origen || 'manual') !== filtroOrigen) return false
    if (filtroArea !== 'todas' && (persona.departamento || 'General') !== filtroArea) return false
    return true
  })
  const pendientesVisibles = visibles.filter((persona) => persona.estado === 'pendiente_aprobacion')
  const todasElegidas = pendientesVisibles.length > 0 && pendientesVisibles.every((persona) => elegidos.includes(persona.id))

  function verPendientes() {
    setElegidos([])
    if (vistaPendientes) {
      setFiltroEstado('todos')
      return
    }
    setFiltroEstado('pendiente_aprobacion')
    setFiltroOrigen('todos')
    setFiltroArea('todas')
  }

  function alternarElegido(id) {
    setElegidos((previo) => (previo.includes(id) ? previo.filter((item) => item !== id) : [...previo, id]))
  }

  function alternarTodas() {
    setElegidos(todasElegidas ? [] : pendientesVisibles.map((persona) => persona.id))
  }

  async function cambiarEstado(ids, estado) {
    if (!ids.length || resolviendo.length) return
    setError(null)
    setAvisoLista(null)
    setResolviendo(ids)
    const { data, error: fallo } = await supabase
      .from('empleados')
      .update({ estado })
      .in('id', ids)
      .select('id, estado')
    setResolviendo([])
    if (fallo) {
      setError(fallo.message || 'No se pudo cambiar el estado.')
      return
    }
    const cambiados = new Set((data ?? []).map((fila) => fila.id))
    if (cambiados.size === 0) {
      setError('No se pudo cambiar el estado. Solo un administrador de la empresa puede hacerlo.')
      return
    }
    setEmpleados((previo) => previo.map((persona) => (
      cambiados.has(persona.id) ? { ...persona, estado } : persona
    )))
    setElegidos((previo) => previo.filter((id) => !cambiados.has(id)))
    const verbo = estado === 'activo' ? 'Aprobadas' : 'Rechazadas'
    setAvisoLista(`${verbo}: ${cambiados.size}.`)
  }

  if (cargando) return <p className="panel-estado">Cargando tu empresa…</p>

  return (
    <div className="panel panel-empresas">
      <header className="panel-header">
        <Link className="panel-volver" to="/panel?app=phishguard">
          ← Volver a las opciones
        </Link>
        <span className="panel-tag">PhishGuard</span>
        <h1>{organizacion ? organizacion.nombre_empresa : 'PhishGuard es pago'}</h1>
        <p className="panel-lead">
          {organizacion
            ? `Plan ${organizacion.plan_id}. Acá cargás a la gente que va a recibir las simulaciones.`
            : 'Esta cuenta no tiene el plan activo. SafeLink sigue disponible.'}
        </p>
      </header>

      {error && <p className="panel-error">{error}</p>}

      {!organizacion ? (
        <p className="panel-vacio">
          PhishGuard se paga por persona. Cuando el plan esté activo vas a poder
          cargar el equipo y armar simulaciones.{' '}
          <Link to="/contacto">Hablar para activarlo</Link>
        </p>
      ) : (
        <>
          <section className="panel-seccion">
            <h2>Agregar empleado</h2>
            <form className="panel-form panel-form-fila" onSubmit={agregarEmpleado}>
              <label className="panel-campo">
                <span>Nombre</span>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </label>
              <label className="panel-campo">
                <span>Correo</span>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </label>
              <label className="panel-campo">
                <span>Área</span>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="General"
                />
              </label>
              <button type="submit" className="panel-boton">
                Agregar
              </button>
            </form>
          </section>

          {esAdministrador(rol) && !cargandoMembresia && (
            <section className="panel-seccion">
              <h2>Importar</h2>
              <ImportarCsv
                empleados={empleados}
                correoAdmin={sesion?.user?.email ?? ''}
                alTerminar={async () => {
                  const estado = await cargar()
                  setOrganizacion(estado.organizacion)
                  setEmpleados(estado.empleados)
                  if (estado.error) setError(estado.error)
                }}
              />
            </section>
          )}

          <section className="panel-seccion">
            <h2>Personas ({empleados.length})</h2>
            {empleados.length === 0 ? (
              <p className="panel-vacio">
                Todavía no cargaste a nadie. Sin personas no hay campaña.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className={vistaPendientes ? 'persona-filtro persona-filtro-activo' : 'persona-filtro'}
                  aria-pressed={vistaPendientes}
                  onClick={verPendientes}
                >
                  Pendientes de aprobación ({pendientes.length})
                </button>
                <div className="persona-filtros">
                  <label className="panel-campo">
                    <span>Estado</span>
                    <select value={filtroEstado} onChange={(evento) => { setFiltroEstado(evento.target.value); setElegidos([]) }}>
                      <option value="todos">Todos</option>
                      {ESTADOS.map(([valor, texto]) => (
                        <option key={valor} value={valor}>{texto}</option>
                      ))}
                    </select>
                  </label>
                  <label className="panel-campo">
                    <span>Origen</span>
                    <select value={filtroOrigen} onChange={(evento) => { setFiltroOrigen(evento.target.value); setElegidos([]) }}>
                      <option value="todos">Todos</option>
                      {ORIGENES.map(([valor, texto]) => (
                        <option key={valor} value={valor}>{texto}</option>
                      ))}
                    </select>
                  </label>
                  <label className="panel-campo">
                    <span>Área</span>
                    <select value={filtroArea} onChange={(evento) => { setFiltroArea(evento.target.value); setElegidos([]) }}>
                      <option value="todas">Todas</option>
                      {areas.map((nombreArea) => (
                        <option key={nombreArea} value={nombreArea}>{nombreArea}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {avisoLista && <p className="panel-aviso" aria-live="polite">{avisoLista}</p>}
                {esAdministrador(rol) && !cargandoMembresia && vistaPendientes && pendientesVisibles.length > 0 && (
                  <div className="persona-lote">
                    <button
                      type="button"
                      className="panel-boton"
                      disabled={elegidos.length === 0 || resolviendo.length > 0}
                      onClick={() => cambiarEstado(elegidos, 'activo')}
                    >
                      Aprobar seleccionadas
                    </button>
                    <button
                      type="button"
                      className="panel-boton-borde"
                      disabled={elegidos.length === 0 || resolviendo.length > 0}
                      onClick={() => cambiarEstado(elegidos, 'rechazado')}
                    >
                      Rechazar seleccionadas
                    </button>
                  </div>
                )}
                {visibles.length === 0 ? (
                  <p className="panel-vacio">
                    {vistaPendientes
                      ? 'No hay personas pendientes de aprobación.'
                      : 'Ninguna persona coincide con esos filtros.'}
                  </p>
                ) : (
                  <div className="csv-tabla-wrap">
                    <table className="csv-tabla persona-tabla">
                      <caption>
                        {vistaPendientes ? 'Pendientes de aprobación' : `Personas filtradas: ${visibles.length}`}
                      </caption>
                      <thead>
                        <tr>
                          {esAdministrador(rol) && !cargandoMembresia && vistaPendientes && (
                            <th>
                              <input
                                type="checkbox"
                                checked={todasElegidas}
                                onChange={alternarTodas}
                                aria-label="Seleccionar todas las pendientes"
                              />
                            </th>
                          )}
                          <th>Nombre</th>
                          <th>Correo</th>
                          <th>Área</th>
                          <th>Origen</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibles.map((empleado) => {
                          const ocupado = resolviendo.includes(empleado.id)
                          const pendiente = empleado.estado === 'pendiente_aprobacion'
                          return (
                            <tr key={empleado.id}>
                              {esAdministrador(rol) && !cargandoMembresia && vistaPendientes && (
                                <td>
                                  {pendiente && (
                                    <input
                                      type="checkbox"
                                      checked={elegidos.includes(empleado.id)}
                                      onChange={() => alternarElegido(empleado.id)}
                                      aria-label={`Seleccionar a ${empleado.nombre}`}
                                      disabled={ocupado}
                                    />
                                  )}
                                </td>
                              )}
                              <td>{empleado.nombre}</td>
                              <td>{empleado.email}</td>
                              <td>{empleado.departamento || 'General'}</td>
                              <td>
                                <span className="persona-badge persona-badge-origen">
                                  {etiqueta(ORIGENES, empleado.origen || 'manual')}
                                </span>
                              </td>
                              <td>
                                <span className={claseEstado(empleado.estado)}>
                                  {etiqueta(ESTADOS, empleado.estado)}
                                </span>
                              </td>
                              <td>
                                <div className="persona-acciones">
                                  {esAdministrador(rol) && !cargandoMembresia && pendiente && (
                                    <>
                                      <button
                                        type="button"
                                        className="persona-accion"
                                        disabled={ocupado}
                                        onClick={() => cambiarEstado([empleado.id], 'activo')}
                                      >
                                        {ocupado ? 'Guardando…' : 'Aprobar'}
                                      </button>
                                      <button
                                        type="button"
                                        className="persona-accion persona-accion-rechazar"
                                        disabled={ocupado}
                                        onClick={() => cambiarEstado([empleado.id], 'rechazado')}
                                      >
                                        Rechazar
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    className="empleado-quitar"
                                    disabled={ocupado}
                                    onClick={() => quitarEmpleado(empleado.id)}
                                  >
                                    Quitar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {resolviendo.length > 0 && (
                  <p className="panel-estado" aria-live="polite">Guardando el cambio…</p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default PanelEmpresa
