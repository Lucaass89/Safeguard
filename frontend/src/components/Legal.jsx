export function Marca({ tipo }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tipo === 'si' ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />}
    </svg>
  )
}

export function Seccion({ id, numero, titulo, children }) {
  return (
    <section id={id} className="lg-seccion" aria-labelledby={`${id}-titulo`}>
      <span className="lg-numero" aria-hidden="true">
        {String(numero).padStart(2, '0')}
      </span>
      <div className="lg-seccion-cuerpo">
        <h2 id={`${id}-titulo`}>{titulo}</h2>
        {children}
      </div>
    </section>
  )
}

export function Indice({ items }) {
  return (
    <nav className="lg-indice" aria-label="En esta página">
      <p>En esta página</p>
      <ol>
        {items.map(([id, texto]) => (
          <li key={id}>
            <a href={`#${id}`}>{texto}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function EnCorto({ items }) {
  return (
    <section id="en-corto" className="lg-corto" aria-labelledby="en-corto-titulo">
      <h2 id="en-corto-titulo">En corto</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <span className="lg-marca lg-marca-si">
              <Marca tipo="si" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
