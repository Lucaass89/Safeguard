import './Avatar.css'

const PALETA = ['var(--sg-teal)', 'var(--sg-blue)', 'var(--sg-green)']

function iniciales(usuario) {
  const meta = usuario?.user_metadata ?? {}
  const nombre = (meta.full_name || meta.name || '').trim()
  const partes = nombre.split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (usuario?.email?.[0] || '·').toUpperCase()
}

function tinte(usuario) {
  const base = usuario?.id || usuario?.email || ''
  let hash = 0
  for (let i = 0; i < base.length; i += 1) hash = (hash * 31 + base.charCodeAt(i)) >>> 0
  return PALETA[hash % PALETA.length]
}

function Avatar({ user, size = 40 }) {
  const medida = Number(size) || 40
  return (
    <span
      className="sg-avatar"
      style={{
        '--avatar-tinte': tinte(user),
        width: medida,
        height: medida,
        fontSize: Math.max(12, Math.round(medida * 0.34)),
      }}
      aria-hidden="true"
    >
      {iniciales(user)}
    </span>
  )
}

export default Avatar
