import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import { useSesion } from '../lib/useSesion.js'
import { combinarConAmenaza, combinarConEnriquecimiento, dominioBase } from '../lib/analisis.js'
import { consultarPeorAmenaza, enriquecer, guardarAnalisis, reportarDominio } from '../lib/enriquecer.js'
import { leerQr } from '../lib/qrContenido.js'
import Resultado from '../components/Resultado.jsx'
import './Panel.css'

const CONFIRMAR_MS = 1500

function soportaDetector() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

function soportaCamara() {
  return soportaDetector() && !!navigator.mediaDevices?.getUserMedia
}

function codigoPrincipal(codigos) {
  const validos = codigos.filter((codigo) => codigo.rawValue)
  if (validos.length === 0) return null
  const area = (codigo) => (codigo.boundingBox?.width ?? 0) * (codigo.boundingBox?.height ?? 0)
  return validos.reduce((mayor, codigo) => (area(codigo) > area(mayor) ? codigo : mayor)).rawValue
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

function VistaPrevia({ vista, nivel, analizando }) {
  const [copiado, setCopiado] = useState(false)
  const { valor, invisibles, extra, sinServidor } = vista
  const destino = extra?.meta_destino ?? extra?.destino ?? null
  const saltos = extra ? [...(extra.cadena ?? []), ...(extra.meta_destino ? [extra.meta_destino] : [])] : []
  const recorrido = saltos
    .map(hostDe)
    .filter((host, indice, lista) => indice === 0 || host !== lista[indice - 1])
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

        {!analizando && extra && (
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

            {recorrido.length > 1 && (
              <div>
                <dt>Pasa por</dt>
                <dd>
                  <ol className="qr-recorrido">
                    {recorrido.map((host, indice) => (
                      <li key={`${host}-${indice}`}>{host}</li>
                    ))}
                  </ol>
                </dd>
              </div>
            )}

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

function ContenidoQr({ contenido }) {
  return (
    <section className={contenido.tipo === 'peligro' ? 'qr-vista qr-vista-peligro' : 'qr-vista'} aria-label="Qué trae el QR">
      <h2>{contenido.titulo}</h2>
      {contenido.datos.length > 0 && (
        <dl>
          {contenido.datos.map(([clave, valor]) => (
            <div key={clave}>
              <dt>{clave}</dt>
              <dd className="qr-dato">{valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {contenido.consejo && <p className="qr-vista-nota">{contenido.consejo}</p>}
    </section>
  )
}

function PanelQr() {
  const { sesion } = useSesion()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const activoRef = useRef(false)
  const cuadroRef = useRef(null)
  const resultadoRef = useRef(null)
  const lienzoRef = useRef(null)
  const ultimoRef = useRef(0)
  const intentoRef = useRef(0)
  const candidatoRef = useRef(null)
  const archivoRef = useRef(null)
  const zoomRef = useRef(null)

  const [escaneando, setEscaneando] = useState(false)
  const [fijando, setFijando] = useState(false)
  const [puedeLinterna, setPuedeLinterna] = useState(false)
  const [linterna, setLinterna] = useState(false)
  const [puedeAcercar, setPuedeAcercar] = useState(false)
  const [acercado, setAcercado] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [vista, setVista] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [contenido, setContenido] = useState(null)
  const [cierre, setCierre] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => detener()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }

  function limpiar() {
    setError(null)
    setResultado(null)
    setVista(null)
    setContenido(null)
    setCierre(null)
  }

  async function procesarCodigo(valor) {
    const leido = leerQr(valor)
    if (leido.tipo !== 'web') {
      setContenido(leido)
      return
    }

    const { local } = leido
    setContenido(null)
    setVista({ valor: local.url, invisibles: leido.invisibles, extra: null, sinServidor: false })
    setAnalizando(true)

    const extra = await enriquecer(local.url)
    const dominioMeta = extra?.meta_destino ? dominioBase(hostDe(extra.meta_destino)) : null
    const { amenaza, fallo } = await consultarPeorAmenaza([local.dominio, extra?.dominio, dominioMeta])

    let final = combinarConAmenaza(local, fallo ? null : amenaza)
    final = combinarConEnriquecimiento(final, extra)

    if (fallo) {
      final = {
        ...final,
        motivos: [
          ...final.motivos,
          'No se pudo consultar la base de amenazas, así que este resultado sale de la dirección y de lo que se pudo abrir.',
        ],
      }
    }

    setVista({ valor: local.url, invisibles: leido.invisibles, extra, sinServidor: !extra })
    setResultado({ ...final, casoId: crypto.randomUUID() })
    setAnalizando(false)

    let { error: falloGuardado } = await guardarAnalisis(sesion, final, 'qr')
    if (falloGuardado?.message?.includes('safelink_analisis_entrada_check')) {
      const segundo = await guardarAnalisis(sesion, final, 'web')
      falloGuardado = segundo.error
    }

    if (falloGuardado) {
      setError('El análisis se hizo, pero no se pudo guardar.')
    }
  }

  useEffect(() => {
    if (!vista && !contenido) return
    resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [vista, contenido])

  function prepararLienzo(video, modo) {
    const ancho = video.videoWidth
    const alto = video.videoHeight
    if (!ancho || !alto) return null

    const lado = Math.min(ancho, alto)
    const margen = modo === 'ajustado' ? Math.floor(lado * 0.18) : 0
    const recorte = lado - margen * 2
    const origenX = Math.floor((ancho - lado) / 2) + margen
    const origenY = Math.floor((alto - lado) / 2) + margen
    if (!lienzoRef.current) lienzoRef.current = document.createElement('canvas')

    const lienzo = lienzoRef.current
    const destino = 960
    if (lienzo.width !== destino) {
      lienzo.width = destino
      lienzo.height = destino
    }

    const ctx = lienzo.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(video, origenX, origenY, recorte, recorte, 0, 0, destino, destino)
    return lienzo
  }

  function aceptar(valor) {
    const ahora = performance.now()
    const previo = candidatoRef.current
    if (previo && previo.valor === valor && ahora - previo.momento < CONFIRMAR_MS) return true
    candidatoRef.current = { valor, momento: ahora }
    setFijando(true)
    return false
  }

  function buscar(ahora = performance.now()) {
    if (!activoRef.current) return

    const video = videoRef.current
    if (!video || video.readyState < 2) {
      cuadroRef.current = requestAnimationFrame(buscar)
      return
    }

    if (ahora - ultimoRef.current < 80) {
      cuadroRef.current = requestAnimationFrame(buscar)
      return
    }

    ultimoRef.current = ahora
    const modo = ['ajustado', 'cuadrado', 'completo'][intentoRef.current % 3]
    intentoRef.current += 1
    const fuente = modo === 'completo' ? video : prepararLienzo(video, modo) ?? video

    detectorRef.current
      .detect(fuente)
      .then((codigos) => {
        if (!activoRef.current) return
        const valor = codigoPrincipal(codigos)
        if (valor && aceptar(valor)) {
          navigator.vibrate?.(40)
          detener()
          procesarCodigo(valor)
          return
        }
        if (!valor && candidatoRef.current && performance.now() - candidatoRef.current.momento > CONFIRMAR_MS) {
          candidatoRef.current = null
          setFijando(false)
        }
        cuadroRef.current = requestAnimationFrame(buscar)
      })
      .catch(() => {
        if (activoRef.current) cuadroRef.current = requestAnimationFrame(buscar)
      })
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
    return { linterna: capacidades.torch === true, zoom: Boolean(zoomRef.current) }
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
      const extras = pista ? await mejorarPista(pista) : { linterna: false, zoom: false }
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
      activoRef.current = true
      setPuedeLinterna(extras.linterna)
      setPuedeAcercar(extras.zoom)
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
      const detector = detectorRef.current ?? new window.BarcodeDetector({ formats: ['qr_code'] })
      detectorRef.current = detector
      const imagen = await createImageBitmap(archivo)
      const codigos = await detector.detect(imagen)
      imagen.close?.()
      const valor = codigoPrincipal(codigos)
      if (!valor) {
        setError('No encontramos un QR en esa imagen. Probá con una captura más nítida o más cerca del código.')
        return
      }
      procesarCodigo(valor)
    } catch {
      setError('No se pudo leer la imagen. Probá con otra.')
    }
  }

  async function reportar() {
    if (!resultado) return
    setError(null)

    const { data, error: fallo } = await reportarDominio(resultado, 'qr')
    if (fallo) {
      setError(`No se pudo enviar el reporte: ${fallo.message}`)
      return
    }

    setCierre(data.cierre)
  }

  const camara = soportaCamara()
  const imagenes = soportaDetector()
  const yaEscaneo = Boolean(vista || contenido)

  return (
    <div className="panel panel-personas">
      <header className="panel-header">
        <Link className="panel-volver" to={rutaEnApp('/panel?app=safelink')}>
          ← Volver a las opciones
        </Link>
        <h1>Escanear un QR</h1>
        <p className="panel-lead">
          Apuntá la cámara al código o elegí una captura. Te mostramos adónde lleva antes de que lo abras: no lo abrimos por vos.
        </p>
      </header>

      {!imagenes && (
        <p className="panel-aviso">
          Este navegador no puede leer códigos QR. Pegá el enlace en{' '}
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
          <video ref={videoRef} className="qr-video" autoPlay muted playsInline hidden={!escaneando} />
          {escaneando ? (
            <>
              <span className={fijando ? 'qr-marco qr-marco-fijando' : 'qr-marco'} aria-hidden="true" />
              <p className="qr-visor-estado" aria-live="polite">
                {fijando ? 'Quedate quieto un segundo' : 'Poné el código dentro del cuadro'}
              </p>
            </>
          ) : (
            <p className="qr-visor-vacio">La cámara aparece acá cuando la actives.</p>
          )}
        </div>
      )}

      {(vista || contenido) && (
        <div className="qr-resultado" ref={resultadoRef}>
          {resultado && (
            <Resultado
              casoId={resultado.casoId}
              nivel={resultado.nivel}
              subtitulo={resultado.dominioDestino ?? resultado.dominio}
              motivos={resultado.motivos}
            >
              {resultado.nivel !== 'verde' && (
                <div className="panel-acciones">
                  {cierre ? (
                    <p className="resultado-aviso">{cierre}</p>
                  ) : (
                    <button type="button" className="panel-boton panel-boton-borde" onClick={reportar}>
                      Reportar este sitio
                    </button>
                  )}
                </div>
              )}
            </Resultado>
          )}
          {vista && <VistaPrevia vista={vista} nivel={resultado?.nivel} analizando={analizando} />}
          {contenido && <ContenidoQr contenido={contenido} />}
        </div>
      )}

      {error && <p className="panel-error">{error}</p>}

      {imagenes && (
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
                Leer una captura
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
