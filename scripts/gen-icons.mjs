// Generates PWA icons and the social share image from public/favicon.svg.
// Run via: node scripts/gen-icons.mjs

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
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

async function png(size) {
  return sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()
}

/**
 * favicon.ico with 16, 32 and 48 px PNG images inside. Google Search wants a
 * favicon that is a multiple of 48 px; browsers pick the size they need.
 */
async function faviconIco(sizes = [16, 32, 48]) {
  const images = await Promise.all(sizes.map(png))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(sizes.length, 4)
  let offset = 6 + 16 * sizes.length
  const entries = sizes.map((size, i) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(size % 256, 0) // width (0 means 256)
    e.writeUInt8(size % 256, 1) // height
    e.writeUInt16LE(1, 4) // color planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(images[i].length, 8)
    e.writeUInt32LE(offset, 12)
    offset += images[i].length
    return e
  })
  writeFileSync(join(PUBLIC, 'favicon.ico'), Buffer.concat([header, ...entries, ...images]))
  console.log('wrote public/favicon.ico')
}

/** Google Play feature graphic (1024x500), saved next to the store texts. */
async function featureGraphic() {
  const mark = await sharp(svg, { density: 384 }).resize(200, 200).toBuffer()
  const text = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
      <style>.t { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; fill: #fafafa; }</style>
      <text x="370" y="230" class="t" font-size="104" font-weight="800">Spy</text>
      <text x="374" y="296" class="t" font-size="38" font-weight="500" fill-opacity="0.8">The party word game</text>
      <text x="374" y="350" class="t" font-size="27" fill-opacity="0.55">One phone or many · Free · No sign-up</text>
    </svg>`)
  await sharp({ create: { width: 1024, height: 500, channels: 4, background: BG } })
    .composite([
      { input: mark, top: 150, left: 120 },
      { input: text, top: 0, left: 0 },
    ])
    .png()
    .toFile(join(__dirname, '..', 'docs', 'play-store', 'feature-graphic.png'))
  console.log('wrote docs/play-store/feature-graphic.png')
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

await faviconIco()
await icon(48, 'favicon-48.png')
await icon(96, 'favicon-96.png')
await icon(180, 'apple-touch-icon.png', { padding: 0, background: BG })
await icon(192, 'icon-192.png')
await icon(512, 'icon-512.png')
await icon(512, 'icon-maskable.png', { padding: 72, background: '#f59f0a' })
await ogImage()
await featureGraphic()
