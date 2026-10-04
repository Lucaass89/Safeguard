import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import './Panel.css'

const grupos = [
  {
    nombre: 'SafeLink',
    clase: 'panel-personas',
    items: [
      { to: '/panel/enlaces', titulo: 'Revisar un enlace', nota: 'Pegá un link y te decimos si es seguro' },
      { to: '/panel/whatsapp', titulo: 'Pegar un WhatsApp', nota: 'Pegá un mensaje sospechoso y te avisamos' },
      { to: '/panel/pdf', titulo: 'Revisar un PDF', nota: 'Subí un PDF y revisamos si esconde algo' },
      { to: '/panel/correo', titulo: 'Revisar un correo', nota: 'Pegá un correo y revisamos si el remitente es real' },
    ],
  },
  {
    nombre: 'PhishGuard',
    clase: 'panel-empresas',
    items: [
      { to: '/panel/empresa', titulo: 'Tu empresa', nota: 'Cargá a tu equipo' },
      { to: '/panel/campanas', titulo: 'Campañas', nota: 'Armá y programá una simulación' },
    ],
  },
]

function Panel() {
  const { sesion } = useSesion()
  const [tablero, setTablero] = useState(null)
  const nombre =
    sesion.user.user_metadata?.full_name ??
    sesion.user.user_metadata?.name ??
    sesion.user.email

  useEffect(() => {
    let activo = true

    supabase.rpc('phishguard_tablero').then(({ data, error }) => {
      if (!activo || error || !data?.organizacion) return
      setTablero({
        eventos: Array.isArray(data.eventos) ? data.eventos : [],
        campanas: Array.isArray(data.campanas) ? data.campanas : [],
      })
    }, () => {})

    return () => {
      activo = false
    }
  }, [])

  const herramientas = grupos.reduce((total, grupo) => total + grupo.items.length, 0) + (tablero ? 1 : 0)
  const correos = tablero?.eventos.length ?? 0
  const clics = tablero?.eventos.filter((evento) => evento.hizo_clic).length ?? 0
  const datos = tablero?.eventos.filter((evento) => evento.ingreso_datos).length ?? 0

  return (
    <div className="panel mesa">
      <div className="mesa-barra">
        <p>
          <span>{nombre}</span>
          <span>{sesion.user.email}</span>
        </p>
        <p>{herramientas} herramientas</p>
      </div>

      {tablero && (
        <Link className="mesa-tablero" to="/panel/tablero">
          <h2>Tablero del equipo</h2>
          {tablero.campanas.length === 0 ? (
            <p className="mesa-tablero-vacio">Todavía no hay campañas</p>
          ) : (
            <ul>
              <li>
                <strong>{tablero.campanas.length}</strong>
                <span>Campañas</span>
              </li>
              <li>
                <strong>{correos}</strong>
                <span>Correos</span>
              </li>
              <li>
                <strong>{clics}</strong>
                <span>Clics</span>
              </li>
              <li>
                <strong>{datos}</strong>
                <span>Datos ingresados</span>
              </li>
            </ul>
          )}
          <span className="mesa-tablero-ir">Mirá cómo evoluciona el riesgo</span>
        </Link>
      )}

      <div className="mesa-hoja">
        {grupos.map((grupo) => (
          <section className={grupo.clase} key={grupo.nombre}>
            <h2>{grupo.nombre}</h2>
            <ol>
              {grupo.items.map((item, indice) => (
                <li key={item.to}>
                  <Link to={item.to}>
                    <span>{String(indice + 1).padStart(2, '0')}</span>
                    <strong>{item.titulo}</strong>
                    <span>{item.nota}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

export default Panel
