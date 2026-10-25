// Generates PWA icons and the social share image from public/favicon.svg.
// Run via: node scripts/gen-icons.mjs

import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')
const BG = '#0a0a0c'
const svg = readFileSync(join(PUBLIC, 'favicon.svg'))

async function icon(size, outName, { padding = 0, background = null } = {}) {
  const inner = size - padding * 2
  const layer = await sharp(svg, { density: 384 }).resize(inner, inner).toBuffer()
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: layer, top: padding, left: padding }])
    .png()
    .toFile(join(PUBLIC, outName))
  console.log(`wrote public/${outName}`)
}

async function ogImage() {
  const mark = await sharp(svg, { density: 384 }).resize(220, 220).toBuffer()
  const text = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <style>
        .t { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; fill: #fafafa; }
      </style>
      <text x="430" y="290" class="t" font-size="96" font-weight="800">Spy</text>
      <text x="430" y="360" class="t" font-size="40" font-weight="500" fill-opacity="0.75">The party word game</text>
      <text x="430" y="420" class="t" font-size="30" fill-opacity="0.55">Free · No sign-up · Play on one phone or many</text>
    </svg>`)
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: BG } })
    .composite([
      { input: mark, top: 205, left: 170 },
      { input: text, top: 0, left: 0 },
    ])
    .png()
    .toFile(join(PUBLIC, 'og-image.png'))
  console.log('wrote public/og-image.png')
}

await icon(32, 'favicon-32.png')
await icon(180, 'apple-touch-icon.png', { padding: 0, background: BG })
await icon(192, 'icon-192.png')
await icon(512, 'icon-512.png')
await icon(512, 'icon-maskable.png', { padding: 72, background: '#f59f0a' })
await ogImage()
