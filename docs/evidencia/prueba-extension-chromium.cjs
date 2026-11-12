const { chromium } = require('playwright')
const http = require('http'); const fs = require('fs')
const srv = http.createServer((q, r) => { r.end(fs.readFileSync(__dirname + '/sitio-prueba.html')) }).listen(8765)
async function correr(cortar) {
  const dir = fs.mkdtempSync(__dirname + '/perfil-')
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium',
    args: ['--disable-extensions-except=/home/user/Safeguard/extension', '--load-extension=/home/user/Safeguard/extension'] })
  if (cortar) await ctx.route('**/*supabase.co/**', (r) => r.abort())
  let sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker')
  const page = await ctx.newPage()
  const t0 = Date.now()
  await page.waitForTimeout(1500); await page.goto('http://localhost:8765/', { waitUntil: 'load' })
  const carga = Date.now() - t0
  await page.waitForTimeout(8000)
  const tab = await sw.evaluate(async () => { const [t] = await chrome.tabs.query({ url: 'http://localhost:8765/*' }); return { badge: await chrome.action.getBadgeText({ tabId: t.id }), estado: (await chrome.storage.session.get(`tab:${t.id}`))[`tab:${t.id}`] } })
  console.log(cortar ? 'CON el servidor cortado' : 'con servidor', '| carga de la página', carga, 'ms | badge', JSON.stringify(tab.badge), '| nivel', tab.estado?.nivel, '|', (tab.estado?.motivos ?? []).slice(0,2).join(' '))
  await ctx.close()
}
;(async () => { await correr(false); await correr(false); await correr(true); srv.close() })().catch((e) => { console.error('FALLO', e.message); process.exit(1) })
