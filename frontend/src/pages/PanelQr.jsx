import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import { useSesion } from '../lib/useSesion.js'
import { analizar, combinarConAmenaza, combinarConEnriquecimiento } from '../lib/analisis.js'
import { consultarPeorAmenaza, enriquecer, guardarAnalisis, reportarDominio } from '../lib/enriquecer.js'
import Resultado from '../components/Resultado.jsx'
import './Panel.css'

function soportaEscaneo() {
  return (
    typeof window !== 'undefined' &&
    'BarcodeDetector' in window &&
    !!navigator.mediaDevices?.getUserMedia
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

  const [escaneando, setEscaneando] = useState(false)
  const [puedeLinterna, setPuedeLinterna] = useState(false)
  const [linterna, setLinterna] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [codigoSinLink, setCodigoSinLink] = useState(null)
  const [cierre, setCierre] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => detener()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function detener() {
    activoRef.current = false
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
    setLinterna(false)
    setPuedeLinterna(false)
  }

  async function procesarCodigo(valor) {
    const local = analizar(valor)
    if (!local) {
      setCodigoSinLink(valor)
      return
    }

    setCodigoSinLink(null)
    setAnalizando(true)

    const extra = await enriquecer(local.url)
    const { amenaza, fallo } = await consultarPeorAmenaza([local.dominio, extra?.dominio])

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
    if (!resultado) return
    resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [resultado])

  function prepararLienzo(video, ajustado) {
    const ancho = video.videoWidth
    const alto = video.videoHeight
    if (!ancho || !alto) return null

    const lado = Math.min(ancho, alto)
    const margen = ajustado ? Math.floor(lado * 0.18) : 0
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

    const ctx = lienzo.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, origenX, origenY, recorte, recorte, 0, 0, destino, destino)
    return lienzo
  }

  function buscar(ahora) {
    if (!activoRef.current) return

    const video = videoRef.current
    if (!video || video.readyState < 2) {
      cuadroRef.current = requestAnimationFrame(buscar)
      return
    }

    if (ahora - ultimoRef.current < 90) {
      cuadroRef.current = requestAnimationFrame(buscar)
      return
    }

    ultimoRef.current = ahora
    const ajustado = intentoRef.current % 2 === 0
    intentoRef.current += 1
    const fuente = prepararLienzo(video, ajustado) ?? video

    detectorRef.current
      .detect(fuente)
      .then((codigos) => {
        if (!activoRef.current) return
        const valor = codigos.find((codigo) => codigo.rawValue)?.rawValue
        if (valor) {
          detener()
          procesarCodigo(valor)
        } else {
          cuadroRef.current = requestAnimationFrame(buscar)
        }
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
    if (avanzado.length > 0) {
      try {
        await pista.applyConstraints({ advanced: avanzado })
      } catch {
        // El celular no aplica el enfoque continuo.
      }
    }
    return capacidades.torch === true
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

  async function iniciar() {
    setError(null)
    setResultado(null)
    setCodigoSinLink(null)
    setCierre(null)
    ultimoRef.current = 0
    intentoRef.current = 0

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
      const tieneLinterna = pista ? await mejorarPista(pista) : false
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
      activoRef.current = true
      setPuedeLinterna(tieneLinterna)
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

  const soportado = soportaEscaneo()
  const yaEscaneo = Boolean(resultado || codigoSinLink)

  return (
    <div className="panel panel-personas">
      <header className="panel-header">
        <Link className="panel-volver" to={rutaEnApp('/panel?app=safelink')}>
          ← Volver a las opciones
        </Link>
        <h1>Escanear un QR</h1>
        <p className="panel-lead">
          Apuntá la cámara al código. Analizamos el enlace antes de que lo abras: no lo abrimos por vos.
        </p>
      </header>

      {!soportado && (
        <p className="panel-aviso">
          Este navegador no puede leer el QR con la cámara. Pegá el enlace en{' '}
          <Link to={rutaEnApp('/panel/enlaces')}>Revisar un enlace</Link>.
        </p>
      )}

      {analizando && (
        <div className="qr-visor" aria-live="polite">
          <p className="qr-visor-vacio">Analizando QR</p>
        </div>
      )}

      {soportado && !analizando && !resultado && (
        <div className="qr-visor">
          <video ref={videoRef} className="qr-video" autoPlay muted playsInline hidden={!escaneando} />
          {escaneando ? (
            <span className="qr-marco" aria-hidden="true" />
          ) : (
            <p className="qr-visor-vacio">La cámara aparece acá cuando la actives.</p>
          )}
        </div>
      )}

      {resultado && (
        <div className="qr-resultado" ref={resultadoRef}>
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
        </div>
      )}

      {codigoSinLink && (
        <p className="panel-aviso">
          El código no es una dirección web: <strong>{codigoSinLink}</strong>. Escaneá otro código.
        </p>
      )}

      {error && <p className="panel-error">{error}</p>}

      {soportado && (
        <div className="qr-acciones">
          {escaneando ? (
            <>
              <button type="button" className="panel-boton panel-boton-borde" onClick={detener}>
                Detener
              </button>
              {puedeLinterna && (
                <button type="button" className="panel-boton panel-boton-borde" onClick={alternarLinterna}>
                  {linterna ? 'Apagar luz' : 'Prender luz'}
                </button>
              )}
            </>
          ) : (
            <button type="button" className="panel-boton" onClick={iniciar} disabled={analizando}>
              {yaEscaneo ? 'Escanear otro código' : 'Usar la cámara'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PanelQr
