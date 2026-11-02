import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import { useSesion } from '../lib/useSesion.js'
import { dominioBase, FALLO_AL_SEGUIR } from '../lib/analisis.js'
import { cerrarRevisionConDetalle, guardarAnalisis, urlParaRevisar } from '../lib/enriquecer.js'
import { leerCodigos, prepararLector } from '../lib/lectorQr.js'
import { leerQr } from '../lib/qrContenido.js'
import Resultado from '../components/Resultado.jsx'
import './Panel.css'

const CONFIRMAR_MS = 1500
const INTERVALO_MS = 120
const LADO_AJUSTADO = 960
const LADO_COMPLETO = 1280

// eslint-disable-next-line no-control-regex
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/

function soportaCamara() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

function soportaLector() {
  return typeof WebAssembly !== 'undefined'
}

function hostDe(direccion) {
  try {
    return new URL(direccion).hostname
  } catch {
    return direccion
  }
}

function Direccion({ valor }) {
  let url
  try {
    url = new URL(valor)
  } catch {
    return <span className="qr-url">{valor}</span>
  }
  const resto = `${url.pathname === '/' ? '' : url.pathname}${url.search}${url.hash}`
  return (
    <span className="qr-url">
      <span className="qr-url-tenue">{url.protocol}//</span>
      <strong>{url.host}</strong>
      {resto && <span className="qr-url-tenue">{resto}</span>}
    </span>
  )
}

function fechaRegistro(iso) {
  if (!iso) return null
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return null
  return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function textoVisible(crudo) {
  return [...crudo]
    .map((letra) =>
      INVISIBLE.test(letra) ? `⟨U+${letra.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}⟩` : letra,
    )
    .join('')
}

function ContenidoCompleto({ crudo }) {
  return (
    <section className="qr-vista" aria-label="Contenido completo del QR">
      <h2>Lo que trae el código</h2>
      <pre className="qr-crudo">{crudo ? textoVisible(crudo) : '(vacío)'}</pre>
      <p className="qr-vista-nota">No abrimos nada por vos: revisá esto antes de usarlo.</p>
    </section>
  )
}

function VistaPrevia({ vista, nivel, analizando }) {
  const [copiado, setCopiado] = useState(false)
  const { valor, invisibles, extra, sinServidor } = vista
  const destino = extra?.meta_destino ?? extra?.destino ?? null
  const cortado = extra?.fallo ? (FALLO_AL_SEGUIR[extra.fallo] ?? FALLO_AL_SEGUIR.conexion) : null
  const cambia = destino && destino.replace(/\/$/, '') !== valor.replace(/\/$/, '')
  const otroSitio = cambia && dominioBase(hostDe(destino)) !== dominioBase(hostDe(valor))
  const registrado = fechaRegistro(extra?.registrado_en)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <section className="qr-vista" aria-label="Vista previa del QR">
      <h2>Adónde lleva</h2>
      <dl>
        <div>
          <dt>Dirección del QR</dt>
          <dd>
            <Direccion valor={valor} />
          </dd>
        </div>

        {analizando && (
          <div>
            <dt>Destino final</dt>
            <dd className="qr-vista-tenue">Siguiendo el enlace…</dd>
          </div>
        )}

        {!analizando && sinServidor && (
          <div>
            <dt>Destino final</dt>
            <dd className="qr-vista-tenue">
              No pudimos abrir el enlace desde nuestro servidor, así que no sabemos si redirige a otro lado.
            </dd>
          </div>
        )}

        {!analizando && cortado && (
          <div>
            <dt>Destino final</dt>
            <dd>
              {cambia ? <Direccion valor={destino} /> : null}
              <span className="qr-vista-nota">{cortado}</span>
            </dd>
          </div>
        )}

        {!analizando && extra && !cortado && (
          <>
            <div>
              <dt>Destino final</dt>
              <dd>
                {cambia ? (
                  <>
                    <Direccion valor={destino} />
                    <span className="qr-vista-nota">
                      {otroSitio
                        ? 'Redirige a otro sitio distinto del que muestra el código.'
                        : 'Redirige dentro del mismo sitio.'}
                    </span>
                  </>
                ) : (
                  <span>No redirige: lleva directo a {extra.dominio ?? hostDe(valor)}.</span>
                )}
              </dd>
            </div>

            <div>
              <dt>Título de la página</dt>
              <dd>{extra.titulo ? `«${extra.titulo}»` : <span className="qr-vista-tenue">La página no tiene título.</span>}</dd>
            </div>

            {registrado && (
              <div>
                <dt>Sitio registrado</dt>
                <dd>En {registrado}</dd>
              </div>
            )}

            <div>
              <dt>Pide una clave</dt>
              <dd>{extra.formulario_clave ? 'Sí, la página tiene un campo de contraseña.' : 'No encontramos un campo de contraseña.'}</dd>
            </div>

            {extra.archivo_peligroso && (
              <div>
                <dt>Descarga</dt>
                <dd>Un programa o una app que se instala.</dd>
              </div>
            )}
          </>
        )}

        {invisibles && (
          <div>
            <dt>Ojo</dt>
            <dd>El código traía caracteres invisibles. Los sacamos para analizar la dirección real.</dd>
          </div>
        )}
      </dl>

      {!analizando && nivel !== 'rojo' && (
        <button type="button" className="panel-boton panel-boton-borde" onClick={copiar}>
          {copiado ? 'Dirección copiada' : 'Copiar la dirección'}
        </button>
      )}
    </section>
  )
}

function ContenidoQr({ contenido, onRevisarEnlace, onNoAbrir }) {
  if (contenido.sinVerificar) {
    return (
      <Resultado
        resultado={{ nivel: 'gris', sinVerificar: true, motivos: [contenido.consejo] }}
        porQue={`${contenido.titulo}.`}
        canal="qr"
        onNoAbrir={onNoAbrir}
      >
        {contenido.datos.length > 0 && (
          <dl className="qr-datos-sueltos">
            {contenido.datos.map(([clave, valor], indice) => (
              <div key={`${clave}-${indice}`}>
                <dt>{clave}</dt>
                <dd className="qr-dato">{valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </Resultado>
    )
  }

  return (
    <section className={contenido.tipo === 'peligro' ? 'qr-vista qr-vista-peligro' : 'qr-vista'} aria-label="Qué trae el QR">
      <h2>{contenido.titulo}</h2>
      {contenido.datos.length > 0 && (
        <dl>
          {contenido.datos.map(([clave, valor], indice) => (
            <div key={`${clave}-${indice}`}>
              <dt>{clave}</dt>
              <dd className="qr-dato">{valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {contenido.avisos?.length > 0 && (
        <ul className="qr-avisos">
          {contenido.avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      )}
      {contenido.consejo && <p className="qr-vista-nota">{contenido.consejo}</p>}
      {contenido.enlace && (
        <button type="button" className="panel-boton panel-boton-borde" onClick={() => onRevisarEnlace(contenido.enlace)}>
          Revisar el enlace que trae
        </button>
      )}
    </section>
  )
}

function ElegirCodigo({ opciones, onElegir }) {
  return (
    <section className="qr-vista" aria-label="Varios códigos">
      <h2>Encontramos {opciones.length} códigos</h2>
      <p className="qr-vista-nota">Elegí cuál querés revisar. No revisamos ninguno hasta que elijas.</p>
      <ol className="qr-opciones">
        {opciones.map((texto, indice) => (
          <li key={`${indice}-${texto}`}>
            <span className="qr-opcion-tipo">{leerQr(texto).titulo}</span>
            <pre className="qr-crudo">{textoVisible(texto)}</pre>
            <button type="button" className="panel-boton panel-boton-borde" onClick={() => onElegir(texto)}>
              Revisar este
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

function PanelQr() {
  const { sesion } = useSesion()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const activoRef = useRef(false)
  const cuadroRef = useRef(null)
  const resultadoRef = useRef(null)
  const lienzoRef = useRef(null)
  const ultimoRef = useRef(0)
  const intentoRef = useRef(0)
  const candidatoRef = useRef(null)
  const archivoRef = useRef(null)
  const zoomRef = useRef(null)
  const focoRef = useRef(null)

  const [escaneando, setEscaneando] = useState(false)
  const [fijando, setFijando] = useState(false)
  const [puedeLinterna, setPuedeLinterna] = useState(false)
  const [linterna, setLinterna] = useState(false)
  const [puedeAcercar, setPuedeAcercar] = useState(false)
  const [acercado, setAcercado] = useState(false)
  const [puedeEnfocar, setPuedeEnfocar] = useState(false)
  const [foco, setFoco] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [crudo, setCrudo] = useState(null)
  const [opciones, setOpciones] = useState(null)
  const [vista, setVista] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [contenido, setContenido] = useState(null)
  const [error, setError] = useState(null)
  const [sinLector, setSinLector] = useState(!soportaLector())

  useEffect(() => {
    if (soportaLector()) prepararLector().catch(() => setSinLector(true))
    return () => {
      detener()
      clearTimeout(focoRef.current)
    }
  }, [])

  function detener() {
    activoRef.current = false
    candidatoRef.current = null
    if (cuadroRef.current) {
      cancelAnimationFrame(cuadroRef.current)
      cuadroRef.current = null
    }
    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((pista) => pista.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setEscaneando(false)
    setFijando(false)
    setLinterna(false)
    setPuedeLinterna(false)
    setAcercado(false)
    setPuedeAcercar(false)
    setPuedeEnfocar(false)
    setFoco(null)
  }

  function limpiar() {
    setError(null)
    setResultado(null)
    setVista(null)
    setContenido(null)
    setCrudo(null)
    setOpciones(null)
  }

  async function procesarCodigo(valor) {
    const leido = leerQr(valor)
    setOpciones(null)
    setCrudo(valor)
    setResultado(null)
    if (leido.tipo !== 'web') {
      setVista(null)
      setContenido(leido)
      return
    }

    const { local } = leido
    setContenido(null)
    setVista({ valor: local.url, invisibles: leido.invisibles, extra: null, sinServidor: false })
    setAnalizando(true)

    const url = urlParaRevisar(local)
    const { final, extra } = await cerrarRevisionConDetalle(local, url, [local.dominio])

    setVista({ valor: local.url, invisibles: leido.invisibles, extra, sinServidor: Boolean(url) && !local.sinSitio && !extra })
    setResultado({ ...final, casoId: crypto.randomUUID() })
    setAnalizando(false)

    if (!sesion) return
    let { error: falloGuardado } = await guardarAnalisis(sesion, final, 'qr')
    if (falloGuardado?.message?.includes('safelink_analisis_entrada_check')) {
      const segundo = await guardarAnalisis(sesion, final, 'web')
      falloGuardado = segundo.error
    }

    if (falloGuardado) {
      setError('El análisis se hizo, pero no se pudo guardar.')
    }
  }

  function entregar(textos) {
    if (textos.length > 1) {
      limpiar()
      setOpciones(textos)
      return
    }
    procesarCodigo(textos[0])
  }

  useEffect(() => {
    if (!vista && !contenido && !opciones) return
    resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [vista, contenido, opciones])

  function capturar(video, modo) {
    const ancho = video.videoWidth
    const alto = video.videoHeight
    if (!ancho || !alto) return null
    if (!lienzoRef.current) lienzoRef.current = document.createElement('canvas')
    const lienzo = lienzoRef.current

    let origen
    let salida
    if (modo === 'ajustado') {
      const lado = Math.min(ancho, alto)
      const margen = Math.floor(lado * 0.18)
      const recorte = lado - margen * 2
      origen = [Math.floor((ancho - lado) / 2) + margen, Math.floor((alto - lado) / 2) + margen, recorte, recorte]
      salida = [LADO_AJUSTADO, LADO_AJUSTADO]
    } else {
      const escala = Math.min(1, LADO_COMPLETO / Math.max(ancho, alto))
      origen = [0, 0, ancho, alto]
      salida = [Math.round(ancho * escala), Math.round(alto * escala)]
    }

    if (lienzo.width !== salida[0] || lienzo.height !== salida[1]) {
      lienzo.width = salida[0]
      lienzo.height = salida[1]
    }
    const ctx = lienzo.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(video, ...origen, 0, 0, ...salida)
    return ctx.getImageData(0, 0, salida[0], salida[1])
  }

  // Un código se acepta cuando se lee igual en dos cuadros seguidos.
  function aceptar(textos) {
    const ahora = performance.now()
    const previo = candidatoRef.current
    if (previo && ahora - previo.momento < CONFIRMAR_MS && textos.some((texto) => previo.textos.has(texto))) {
      textos.forEach((texto) => previo.textos.add(texto))
      return [...previo.textos]
    }
    candidatoRef.current = { textos: new Set(textos), momento: ahora }
    setFijando(true)
    return null
  }

  function seguirBuscando() {
    if (activoRef.current) cuadroRef.current = requestAnimationFrame(buscar)
  }

  async function buscar(ahora = performance.now()) {
    if (!activoRef.current) return
    const video = videoRef.current
    if (!video || video.readyState < 2 || ahora - ultimoRef.current < INTERVALO_MS) {
      seguirBuscando()
      return
    }
    ultimoRef.current = ahora

    const modo = intentoRef.current % 2 === 0 ? 'ajustado' : 'completo'
    intentoRef.current += 1
    const cuadro = capturar(video, modo)
    let textos
    try {
      textos = cuadro ? await leerCodigos(cuadro) : []
    } catch {
      textos = []
    }
    if (!activoRef.current) return

    if (textos.length > 0) {
      const confirmados = aceptar(textos)
      if (confirmados) {
        const completo = capturar(video, 'completo')
        const todos = completo ? await leerCodigos(completo).catch(() => []) : []
        navigator.vibrate?.(40)
        detener()
        entregar([...new Set([...confirmados, ...todos])])
        return
      }
    } else if (candidatoRef.current && performance.now() - candidatoRef.current.momento > CONFIRMAR_MS) {
      candidatoRef.current = null
      setFijando(false)
    }
    seguirBuscando()
  }

  async function mejorarPista(pista) {
    const capacidades = pista.getCapabilities?.() ?? {}
    const avanzado = []
    if (Array.isArray(capacidades.focusMode) && capacidades.focusMode.includes('continuous')) {
      avanzado.push({ focusMode: 'continuous' })
    }
    if (Array.isArray(capacidades.exposureMode) && capacidades.exposureMode.includes('continuous')) {
      avanzado.push({ exposureMode: 'continuous' })
    }
    if (Array.isArray(capacidades.whiteBalanceMode) && capacidades.whiteBalanceMode.includes('continuous')) {
      avanzado.push({ whiteBalanceMode: 'continuous' })
    }
    if (avanzado.length > 0) {
      try {
        await pista.applyConstraints({ advanced: avanzado })
      } catch {
        // El celular no aplica el enfoque continuo.
      }
    }
    const zoom = capacidades.zoom
    zoomRef.current = zoom && zoom.max > zoom.min ? zoom : null
    const modos = Array.isArray(capacidades.focusMode) ? capacidades.focusMode : []
    const ajustes = pista.getSettings?.() ?? {}
    return {
      linterna: capacidades.torch === true,
      zoom: Boolean(zoomRef.current),
      enfoque: modos.includes('single-shot') || modos.includes('manual') || 'pointsOfInterest' in ajustes,
    }
  }

  async function enfocar(evento) {
    const pista = streamRef.current?.getVideoTracks()[0]
    const video = videoRef.current
    if (!pista || !video?.videoWidth) return

    const caja = video.getBoundingClientRect()
    const escala = Math.max(caja.width / video.videoWidth, caja.height / video.videoHeight)
    const tocadoX = evento.clientX - caja.left
    const tocadoY = evento.clientY - caja.top
    const x = ((video.videoWidth - caja.width / escala) / 2 + tocadoX / escala) / video.videoWidth
    const y = ((video.videoHeight - caja.height / escala) / 2 + tocadoY / escala) / video.videoHeight
    const punto = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
    setFoco({ x: tocadoX, y: tocadoY, id: performance.now() })

    const modos = pista.getCapabilities?.().focusMode ?? []
    const unaVez = modos.includes('single-shot') ? { focusMode: 'single-shot' } : {}
    for (const intento of [{ pointsOfInterest: [punto], ...unaVez }, unaVez]) {
      if (Object.keys(intento).length === 0) continue
      try {
        await pista.applyConstraints({ advanced: [intento] })
        break
      } catch {
        // Se prueba la forma siguiente.
      }
    }

    clearTimeout(focoRef.current)
    focoRef.current = setTimeout(() => {
      setFoco(null)
      if (modos.includes('continuous') && streamRef.current) {
        pista.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
      }
    }, 3000)
  }

  async function alternarLinterna() {
    const pista = streamRef.current?.getVideoTracks()[0]
    if (!pista) return
    const siguiente = !linterna
    try {
      await pista.applyConstraints({ advanced: [{ torch: siguiente }] })
      setLinterna(siguiente)
    } catch {
      setLinterna(false)
    }
  }

  async function alternarZoom() {
    const pista = streamRef.current?.getVideoTracks()[0]
    const zoom = zoomRef.current
    if (!pista || !zoom) return
    const siguiente = !acercado
    const valor = siguiente ? Math.min(zoom.max, Math.max(zoom.min, 2)) : zoom.min
    try {
      await pista.applyConstraints({ advanced: [{ zoom: valor }] })
      setAcercado(siguiente)
    } catch {
      setAcercado(false)
    }
  }

  async function iniciar() {
    limpiar()
    ultimoRef.current = 0
    intentoRef.current = 0
    candidatoRef.current = null

    try {
      await prepararLector()
    } catch {
      setSinLector(true)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      if (!videoRef.current) {
        stream.getTracks().forEach((pista) => pista.stop())
        return
      }

      streamRef.current = stream
      const pista = stream.getVideoTracks()[0]
      const extras = pista ? await mejorarPista(pista) : { linterna: false, zoom: false, enfoque: false }
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      activoRef.current = true
      setPuedeLinterna(extras.linterna)
      setPuedeAcercar(extras.zoom)
      setPuedeEnfocar(extras.enfoque)
      setEscaneando(true)
      buscar()
    } catch (fallo) {
      if (fallo?.name === 'NotAllowedError') {
        setError('No se pudo usar la cámara. Dale permiso a SafeGuard y probá de nuevo.')
      } else if (fallo?.name === 'NotFoundError') {
        setError('No encontramos una cámara en este dispositivo.')
      } else {
        setError('No se pudo abrir la cámara. Probá de nuevo.')
      }
    }
  }

  async function leerImagen(evento) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return

    detener()
    limpiar()

    try {
      const textos = await leerCodigos(archivo)
      if (textos.length === 0) {
        setError('No encontramos un QR en esa imagen. Probá con una captura más nítida o más cerca del código.')
        return
      }
      entregar(textos)
    } catch {
      setError('No se pudo leer la imagen. Probá con otra.')
    }
  }

  const camara = soportaCamara() && !sinLector
  const yaEscaneo = Boolean(vista || contenido || opciones)

  return (
    <div className="panel panel-personas">
      <header className="panel-header">
        <Link className="panel-volver" to={rutaEnApp('/panel?app=safelink')}>
          ← Volver a las opciones
        </Link>
        <h1>Escanear un QR</h1>
        <p className="panel-lead">
          Apuntá la cámara al código o elegí una imagen de la galería. Te mostramos lo que trae antes de que hagas nada: no abrimos nada por vos.
        </p>
      </header>

      {sinLector && (
        <p className="panel-aviso">
          No se pudo cargar el lector de QR en este dispositivo. Pegá el enlace en{' '}
          <Link to={rutaEnApp('/panel/enlaces')}>Revisar un enlace</Link>.
        </p>
      )}

      {analizando && (
        <div className="qr-visor" aria-live="polite">
          <p className="qr-visor-vacio">Analizando QR</p>
        </div>
      )}

      {camara && !analizando && !yaEscaneo && (
        <div className="qr-visor">
          <video
            ref={videoRef}
            className="qr-video"
            autoPlay
            muted
            playsInline
            hidden={!escaneando}
            onClick={escaneando ? enfocar : undefined}
          />
          {escaneando ? (
            <>
              <span className={fijando ? 'qr-marco qr-marco-fijando' : 'qr-marco'} aria-hidden="true" />
              {foco && <span key={foco.id} className="qr-foco" style={{ left: foco.x, top: foco.y }} aria-hidden="true" />}
              <p className="qr-visor-estado" aria-live="polite">
                {fijando
                  ? 'Quedate quieto un segundo'
                  : puedeEnfocar
                    ? 'Poné el código en el cuadro. Tocá la imagen para enfocar'
                    : 'Poné el código dentro del cuadro'}
              </p>
            </>
          ) : (
            <p className="qr-visor-vacio">La cámara aparece acá cuando la actives.</p>
          )}
        </div>
      )}

      {yaEscaneo && (
        <div className="qr-resultado" ref={resultadoRef}>
          {opciones && <ElegirCodigo opciones={opciones} onElegir={procesarCodigo} />}
          {crudo !== null && <ContenidoCompleto crudo={crudo} />}
          {resultado && (
            <Resultado casoId={resultado.casoId} resultado={resultado} canal="qr" onNoAbrir={limpiar} />
          )}
          {vista && <VistaPrevia vista={vista} nivel={resultado?.nivel} analizando={analizando} />}
          {contenido && <ContenidoQr contenido={contenido} onRevisarEnlace={procesarCodigo} onNoAbrir={limpiar} />}
        </div>
      )}

      {error && <p className="panel-error">{error}</p>}

      {!sinLector && (
        <div className="qr-acciones">
          {escaneando ? (
            <>
              <button type="button" className="panel-boton panel-boton-borde" onClick={detener}>
                Detener
              </button>
              {puedeAcercar && (
                <button type="button" className="panel-boton panel-boton-borde" onClick={alternarZoom}>
                  {acercado ? 'Alejar' : 'Acercar'}
                </button>
              )}
              {puedeLinterna && (
                <button type="button" className="panel-boton panel-boton-borde" onClick={alternarLinterna}>
                  {linterna ? 'Apagar luz' : 'Prender luz'}
                </button>
              )}
            </>
          ) : (
            <>
              {camara && (
                <button type="button" className="panel-boton" onClick={iniciar} disabled={analizando}>
                  {yaEscaneo ? 'Escanear otro código' : 'Usar la cámara'}
                </button>
              )}
              <button
                type="button"
                className="panel-boton panel-boton-borde"
                onClick={() => archivoRef.current?.click()}
                disabled={analizando}
              >
                Elegir de la galería
              </button>
              <input ref={archivoRef} type="file" accept="image/*" hidden onChange={leerImagen} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PanelQr
