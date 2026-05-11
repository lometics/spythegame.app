// One-shot script to generate PWA icon PNGs from the SVG.
// Run via: node scripts/gen-icons.mjs

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

const svgBuffer = readFileSync(join(PUBLIC, 'favicon.svg'))

async function render(size, outName, padding = 0) {
  const inner = size - padding * 2
  const layer = await sharp(svgBuffer, { density: 384 })
    .resize(inner, inner, { fit: 'contain' })
    .toBuffer()
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 11, g: 16, b: 32, alpha: 1 }, // #0b1020
    },
  })
    .composite([{ input: layer, top: padding, left: padding }])
    .png()
    .toFile(join(PUBLIC, outName))
  console.log(`wrote public/${outName}  (${size}x${size})`)
}

await render(192, 'icon-192.png', 0)
await render(512, 'icon-512.png', 0)
// Maskable: inner safe-zone is 80% of canvas, so pad ~10%
await render(512, 'icon-maskable.png', 51)
await render(180, 'apple-touch-icon.png', 0)

// Tiny favicon ico replacement (32x32 PNG works in modern browsers)
const fav32 = await sharp(svgBuffer, { density: 96 })
  .resize(32, 32, { fit: 'contain', background: { r: 11, g: 16, b: 32, alpha: 1 } })
  .png()
  .toBuffer()
writeFileSync(join(PUBLIC, 'favicon-32.png'), fav32)
console.log('wrote public/favicon-32.png')
