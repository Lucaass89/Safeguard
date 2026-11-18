import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { estadoReporte, textoInvitacion } from './reportesPropios.js'

describe('mis reportes e invitar', () => {
  test('nombra el estado de cada reporte', () => {
    assert.equal(estadoReporte('pendiente').etiqueta, 'En revisión')
    assert.equal(estadoReporte('revisado').nivel, 'verde')
    assert.equal(estadoReporte('descartado').etiqueta, 'No era un engaño')
    assert.equal(estadoReporte('raro').etiqueta, 'En revisión')
  })

  test('el texto para invitar lleva el enlace y el primer nombre', () => {
    const texto = textoInvitacion('Ana Prueba')
    assert.match(texto, /https:\/\/safeguardd\.vercel\.app\/personas/)
    assert.match(texto, /Te lo recomienda Ana\.$/)
    assert.doesNotMatch(textoInvitacion(''), /recomienda/)
  })
})
