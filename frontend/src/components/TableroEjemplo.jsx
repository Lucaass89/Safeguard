import { caminoArea, caminoLinea, marcasEje, porcentaje, puntosLinea } from '../lib/graficoLinea.js'
import './TableroEjemplo.css'

const PERSONAS = 40

const CAMPANAS = [
  { nombre: 'Campaña 1', corto: 'C1', cayeron: 8 },
  { nombre: 'Campaña 2', corto: 'C2', cayeron: 6 },
  { nombre: 'Campaña 3', corto: 'C3', cayeron: 5 },
  { nombre: 'Campaña 4', corto: 'C4', cayeron: 3 },
  { nombre: 'Campaña 5', corto: 'C5', cayeron: 2 },
]

const AREAS = [
  { area: 'Ventas', personas: 12, cayeron: 4 },
  { area: 'Administración', personas: 10, cayeron: 3 },
  { area: 'Sistemas', personas: 9, cayeron: 1 },
  { area: 'Atención al público', personas: 9, cayeron: 1 },
]

const CAYERON = AREAS.reduce((total, area) => total + area.cayeron, 0)
const CAPACITADOS = 31
const MEJORARON = 6

const GRAFICO = { ancho: 268, alto: 92, izquierda: 40, arriba: 12 }
const MAXIMO = 30
const BASE = GRAFICO.arriba + GRAFICO.alto

function TableroEjemplo() {
  const tasas = CAMPANAS.map((c) => porcentaje(c.cayeron, PERSONAS))
  const puntos = puntosLinea(tasas, { ...GRAFICO, maximo: MAXIMO })
  const marcas = marcasEje(MAXIMO, 4)
  const primera = tasas[0]
  const ultima = tasas[tasas.length - 1]

  return (
    <aside className="portada-tablero tablero-ej" aria-label="Vista previa del tablero de PhishGuard, con datos ficticios">
      <header className="tablero-ej-cabeza">
        <div>
          <p className="tablero-ej-ruta">PhishGuard · Tablero</p>
          <h3>Vulnerabilidad del equipo</h3>
          <p className="tablero-ej-sub">Empresa de ejemplo · {PERSONAS} personas · {CAMPANAS.length} campañas</p>
        </div>
        <span className="tablero-ej-chip">Datos ficticios</span>
      </header>

      <ul className="tablero-ej-kpis">
        <li>
          <span className="tablero-ej-kpi-nombre">Cayeron alguna vez</span>
          <strong>{CAYERON}</strong>
          <span className="tablero-ej-kpi-extra">{porcentaje(CAYERON, PERSONAS)} % del equipo</span>
        </li>
        <li>
          <span className="tablero-ej-kpi-nombre">Se capacitaron</span>
          <strong>{CAPACITADOS}</strong>
          <span className="tablero-ej-kpi-extra">{porcentaje(CAPACITADOS, PERSONAS)} % del equipo</span>
        </li>
        <li>
          <span className="tablero-ej-kpi-nombre">Mejoraron</span>
          <strong>
            {MEJORARON}
            <small> de {CAYERON}</small>
          </strong>
          <span className="tablero-ej-kpi-extra">no volvieron a caer</span>
        </li>
      </ul>

      <figure className="tablero-ej-bloque">
        <figcaption>
          <span>Cayeron por campaña</span>
          <span className="tablero-ej-delta">
            de {primera} % a {ultima} %
          </span>
        </figcaption>
        <svg
          className="tablero-ej-linea"
          viewBox="0 0 320 128"
          role="img"
          aria-label={`Porcentaje del equipo que cayó en cada campaña: ${CAMPANAS.map((c, i) => `${c.nombre}, ${tasas[i]} %`).join('; ')}.`}
        >
          {marcas.map((marca) => {
            const y = BASE - (marca / MAXIMO) * GRAFICO.alto
            return (
              <g key={marca} className="tablero-ej-grilla">
                <line x1={GRAFICO.izquierda} x2={GRAFICO.izquierda + GRAFICO.ancho} y1={y} y2={y} />
                <text x={GRAFICO.izquierda - 8} y={y} dominantBaseline="middle" textAnchor="end">
                  {marca} %
                </text>
              </g>
            )
          })}
          <path className="tablero-ej-area" d={caminoArea(puntos, BASE)} />
          <path className="tablero-ej-trazo" d={caminoLinea(puntos)} />
          {puntos.map((punto, indice) => (
            <g key={CAMPANAS[indice].corto} className="tablero-ej-punto" tabIndex={0}>
              <title>{`${CAMPANAS[indice].nombre}: ${tasas[indice]} % (${CAMPANAS[indice].cayeron} de ${PERSONAS})`}</title>
              <circle className="tablero-ej-blanco" cx={punto.x} cy={punto.y} r="12" />
              <circle className="tablero-ej-marca" cx={punto.x} cy={punto.y} r="4" />
              <text className="tablero-ej-eje" x={punto.x} y={BASE + 16} textAnchor="middle">
                {CAMPANAS[indice].corto}
              </text>
            </g>
          ))}
          <text
            className="tablero-ej-valor"
            x={puntos[puntos.length - 1].x}
            y={puntos[puntos.length - 1].y - 12}
            textAnchor="end"
          >
            {ultima} %
          </text>
        </svg>
      </figure>

      <section className="tablero-ej-bloque" aria-labelledby="tablero-ej-areas">
        <h4 id="tablero-ej-areas">Cayeron por área</h4>
        <ul className="tablero-ej-areas">
          {AREAS.map((area) => {
            const tasa = porcentaje(area.cayeron, area.personas)
            return (
              <li key={area.area}>
                <span className="tablero-ej-area-nombre">{area.area}</span>
                <span className="tablero-ej-medidor" aria-hidden="true">
                  <span style={{ width: `${tasa}%` }} />
                </span>
                <span className="tablero-ej-area-valor">
                  {area.cayeron} de {area.personas}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </aside>
  )
}

export default TableroEjemplo
