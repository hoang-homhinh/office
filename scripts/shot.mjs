// Visual QA: opens the running app, jumps to key times and saves screenshots to ./shots.
// Usage: node scripts/shot.mjs [baseUrl] [times...]   (times as HH:MM, default set below)
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:4173/'
const times = process.argv.slice(3).length ? process.argv.slice(3) : ['07:50', '08:35', '10:30', '12:15', '12:50', '15:10', '17:45', '21:00']
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m }

mkdirSync('shots', { recursive: true })
const browser = await chromium.launch({ executablePath: exe[0], args: process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(String(e)))
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForFunction(() => !!window.__office, null, { timeout: 30000 })
await page.evaluate(() => window.__office.pause(true))
await page.waitForTimeout(2500)

for (const t of times) {
  await page.evaluate(m => window.__office.jump(m), toMin(t))
  await page.waitForTimeout(1500)
  const name = t.replace(':', '')
  await page.locator('.stage').screenshot({ path: `shots/stage-${name}.png` })
}
await page.evaluate(m => window.__office.jump(m), toMin('10:30'))
await page.waitForTimeout(1200)
await page.screenshot({ path: 'shots/full-1030.png', fullPage: true })
await page.evaluate(() => window.__office.view('team'))
await page.waitForTimeout(1800)
await page.locator('.stage').screenshot({ path: 'shots/team-1030.png' })
// selected person + detail card
await page.evaluate(m => { window.__office.jump(m); window.__office.select(1) }, toMin('15:20'))
await page.waitForTimeout(1800)
await page.locator('.stage').screenshot({ path: 'shots/select-1520.png' })
await page.evaluate(() => window.__office.select(null))
// dark theme
await page.click('.theme button[aria-label="Giao diện tối"]')
await page.evaluate(() => window.__office.view('building'))
await page.waitForTimeout(1500)
await page.screenshot({ path: 'shots/dark-full.png', fullPage: true })
// timeline tab
await page.evaluate(() => window.__office.tab('timeline'))
await page.waitForTimeout(800)
await page.screenshot({ path: 'shots/timeline.png', fullPage: false })
await page.evaluate(() => window.__office.tab('office'))
await page.click('.theme button[aria-label="Giao diện sáng"]')
// fps while running
await page.evaluate(() => { window.__office.pause(false); window.__office.speed(4) })
await page.waitForTimeout(3000)
const fps = await page.evaluate(() => window.__office.fps)
// narrow screen
await page.setViewportSize({ width: 420, height: 900 })
await page.waitForTimeout(1200)
await page.screenshot({ path: 'shots/mobile.png', fullPage: false })
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
console.log('horizontal overflow px:', overflow)
console.log(JSON.stringify({ fps, errors: errors.slice(0, 10) }, null, 1))
await browser.close()
