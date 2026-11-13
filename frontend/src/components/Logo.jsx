import { useId } from 'react'

const BARRAS = [
  '4,154 5,188 137,262 142,263 142,231',
  '4,89 6,123 201,227 227,193 195,190',
  '4,8 12,8 67,37 46,37 47,40 257,154 233,186 214,177 208,173 214,165 212,163 6,52',
  '30,8 118,8 238,74 240,59 266,73 266,124 109,37 84,37',
]

const PARADAS = [
  ['0', '--sg-logo-0', '#2ad4ee'],
  ['0.34', '--sg-logo-1', '#1e8ed4'],
  ['0.66', '--sg-logo-2', '#1a52be'],
  ['1', '--sg-logo-3', '#1a1c8c'],
]

function Logo({ className }) {
  const id = `sg-logo${useId().replace(/:/g, '')}`

  return (
    <svg className={className} viewBox="0 0 267 269" aria-hidden="true">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="269">
          {PARADAS.map(([offset, variable, color]) => (
            <stop key={offset} offset={offset} style={{ stopColor: `var(${variable}, ${color})` }} />
          ))}
        </linearGradient>
      </defs>
      {BARRAS.map((points) => (
        <polygon key={points} points={points} fill={`url(#${id})`} />
      ))}
    </svg>
  )
}

export default Logo
