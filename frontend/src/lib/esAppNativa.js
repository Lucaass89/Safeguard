const MARCA = 'SafeGuardApp'

export function esAppNativa() {
  return navigator.userAgent.includes(MARCA)
}
