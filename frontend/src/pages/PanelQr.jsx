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

  const [escaneando, setEscaneando] = useState(false)
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

    const { error: falloGuardado } = await guardarAnalisis(sesion, final, 'qr')
    setAnalizando(false)

    if (falloGuardado) {
      setError(`El análisis se hizo, pero no se pudo guardar: ${falloGuardado.message}`)
    }
  }

  function buscar() {
    if (!activoRef.current) return

    if (!videoRef.current || videoRef.current.readyState < 2) {
      cuadroRef.current = requestAnimationFrame(buscar)
      return
    }

    detectorRef.current
      .detect(videoRef.current)
      .then((codigos) => {
        if (!activoRef.current) return
        if (codigos.length > 0) {
          const valor = codigos[0].rawValue
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

  async function iniciar() {
    setError(null)
    setResultado(null)
    setCodigoSinLink(null)
    setCierre(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      if (!videoRef.current) {
        stream.getTracks().forEach((pista) => pista.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
      activoRef.current = true
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

      {soportado && (
        <div className="panel-pieza">
          <div className="qr-visor">
            <video ref={videoRef} className="qr-video" autoPlay muted playsInline hidden={!escaneando} />
            {escaneando ? (
              <span className="qr-marco" aria-hidden="true" />
            ) : (
              <p className="qr-visor-vacio">La cámara aparece acá cuando la actives.</p>
            )}
          </div>

          <div className="qr-acciones">
            {escaneando ? (
              <button type="button" className="panel-boton panel-boton-borde" onClick={detener}>
                Detener
              </button>
            ) : (
              <button type="button" className="panel-boton" onClick={iniciar}>
                {yaEscaneo ? 'Escanear otro código' : 'Usar la cámara'}
              </button>
            )}
          </div>
        </div>
      )}

      {analizando && <p className="panel-estado">Analizando…</p>}
      {error && <p className="panel-error">{error}</p>}

      {codigoSinLink && (
        <p className="panel-aviso">
          El código no es una dirección web: <strong>{codigoSinLink}</strong>. Escaneá otro código.
        </p>
      )}

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
    </div>
  )
}

export default PanelQr
