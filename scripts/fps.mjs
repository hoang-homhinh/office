// Measures fps in a few situations on the real GPU. Usage: node scripts/fps.mjs [baseUrl]
import { chromium } from 'playwright-core'

const base = process.argv[2] ?? 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForFunction(() => !!window.__office)
const probe = async (label, setup) => {
  await page.evaluate(setup)
  await page.waitForTimeout(3500)
  console.log(label.padEnd(28), JSON.stringify(await page.evaluate(() => window.__office.perf)))
}
await probe('building 10:30 running 4x', () => { window.__office.jump(630); window.__office.speed(4); window.__office.view('building') })
await probe('team close-up', () => window.__office.view('team'))
await probe('all view', () => window.__office.view('all'))
await probe('night 21:00 building', () => { window.__office.jump(1260); window.__office.view('building') })
await probe('dark theme', () => { document.documentElement.dataset.theme = 'dark' })
await probe('after timeline tab', async () => { window.__office.tab('timeline'); await new Promise(r => setTimeout(r, 500)); window.__office.tab('office') })
await probe('selected person', () => { window.__office.jump(640); window.__office.select(2) })
await browser.close()
