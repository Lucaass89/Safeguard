---
name: brand-guidelines
description: Aplica la marca de SafeGuard (colores, tipografías, logo y tono) a pantallas del frontend, documentos del TFC, presentaciones, informes de PhishGuard o cualquier pieza que tenga que verse como SafeGuard. Usala cuando se pidan colores de marca, guía de estilo, formato visual o estándares de diseño del proyecto.
license: Estructura basada en la skill brand-guidelines de Anthropic; ver LICENSE.txt
---

# Marca SafeGuard

Los valores salen de `frontend/src/index.css`, `frontend/src/TemaOscuro.css`, `frontend/index.html` y
`frontend/public/favicon.svg`. Si cambian ahí, esta guía se actualiza para coincidir; el código manda.

## Colores

El sitio tiene dos temas. El claro es el que se carga por defecto.

**Tema claro (`html[data-tema='claro']`)**

- Fondo: `#f3eee6`
- Superficie (tarjetas, paneles): `#faf6f1`
- Texto: `#3c342c`
- Texto secundario: `#6f655c`
- Líneas y bordes: `#e4d9cc`
- Acento: `#7a6552`

**Tema oscuro (`html[data-tema='oscuro']`)**

- Fondo: `#0b0f17`
- Superficie: `#131a26`
- Texto: `#f3f4f6`
- Texto secundario: `#9ca3af`
- Líneas y bordes: `#26334d`
- Acento: `#2563eb`

**Semáforo de SafeLink** (mismo significado en todas las piezas, nunca como decoración)

- Verde, seguro: `#34d399`
- Amarillo, dudoso: `#fbbf24`
- Rojo, peligroso: `#f87171`
- Gris, sin datos suficientes: el texto secundario del tema

**Logo**: degradé vertical `#2ad4ee` → `#1e8ed4` → `#1a52be` → `#1a1c8c` (ver `favicon.svg`). El degradé es
del logo; no se usa como fondo ni adorno.

En el código, usar siempre las variables (`--sg-bg`, `--sg-surface`, `--sg-text`, `--sg-muted`, `--sg-line`,
`--sg-accent`, `--sg-green`, `--sg-yellow`, `--sg-red`) en lugar de escribir el hex.

## Tipografía

- **Títulos y marca**: Space Grotesk 500–700, con `var(--sg-sans)` de respaldo.
- **Texto general**: Inter 300–700 (`var(--sg-sans)`), 16px, interlineado 1.55.
- **Datos técnicos** (URL, dominios, hashes): JetBrains Mono (`var(--sg-mono)`).
- **Serif puntual**: Source Serif 4, solo donde ya la usa la landing.

Las cuatro se cargan desde Google Fonts en `index.html`. Fuera de la web (PDF, Word, diapositivas), si no
están instaladas: Arial para títulos y texto, Georgia para la serif, Consolas para la mono.

## Formas

- Radio de borde: `--sg-radius` (10px) en tarjetas y `--sg-radius-sm` (6px) en botones y controles.
- Transiciones: `--sg-ease` (200ms ease).

## Tono

- Español rioplatense, con "vos", frases cortas y simples.
- Explica qué pasa y qué hacer; no asusta ni culpa a quien cayó en una simulación.
- Los nombres de módulos van así: SafeGuard, PhishGuard, SafeLink, Faro.

## Al aplicar la marca

1. Elegir tema claro u oscuro según dónde se va a ver la pieza; no mezclar valores de los dos.
2. Respetar el contraste mínimo WCAG AA entre texto y fondo.
3. En documentos del TFC, mantener el color sobrio: fondo blanco o `#faf6f1`, texto `#3c342c`, acento
   `#7a6552`, y el semáforo solo donde se hable de resultados de SafeLink.
