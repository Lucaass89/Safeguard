const { chromium } = require('playwright')
const fs = require('fs')
async function correr(cortar) {
  const dir = fs.mkdtempSync(require('os').tmpdir() + '/perfil-')
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium',
    args: ['--disable-extensions-except=/home/user/Safeguard/extension', '--load-extension=/home/user/Safeguard/extension'] })
  if (cortar) await ctx.route(/supabase\.co/, (r) => r.abort())
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker')
  const p = await ctx.newPage()
  await p.waitForTimeout(1500)
  const t0 = Date.now()
  await p.goto('https://safeguardd.vercel.app/', { waitUntil: 'load' })
  const carga = Date.now() - t0
  await p.waitForTimeout(9000)
  const estado = await sw.evaluate(async () => {
    const [t] = await chrome.tabs.query({ url: 'https://safeguardd.vercel.app/*' })
    const todo = await chrome.storage.session.get(null)
    return { titulo: await chrome.action.getTitle({ tabId: t.id }), guardado: Object.values(todo).find((v) => v && typeof v === 'object' && (v.nivel || v.titulo)) ?? Object.keys(todo) }
  })
  const id = sw.url().split('/')[2]
  if (!cortar) {
    const popup = await ctx.newPage()
    await p.bringToFront(); await popup.goto(`chrome-extension://${id}/popup.html`); await popup.waitForTimeout(800)
    await popup.screenshot({ path: '/home/user/Safeguard/docs/evidencia/CP-13-extension.png' })
    console.log('POPUP', (await popup.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300))
  }
  const version = JSON.parse(fs.readFileSync('/home/user/Safeguard/extension/manifest.json')).version
  console.log(JSON.stringify({ cortar, version, carga, titulo: estado.titulo, guardado: JSON.stringify(estado.guardado).slice(0, 300), url_sigue: p.url() }))
  await ctx.close()
}
;(async () => { await correr(false); await correr(true) })().catch((e) => { console.error('FALLO', e.message); process.exit(1) })
