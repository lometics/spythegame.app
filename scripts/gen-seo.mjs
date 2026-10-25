// Generates static, crawlable pages into dist/ after `vite build`:
//   /<lang>/            landing page per language (rules, hint levels, categories)
//   /<lang>/<category>/ every playable word of a word bank category
//   /sitemap.xml        all of the above with hreflang alternates
// Texts come from the app's locale files (keys under "seo", "rules", "hint",
// "categories") and the word bank, so pages stay in sync with the game.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE = 'https://spythegame.app'
const LANGS = ['en', 'de', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'sv', 'tr', 'ru', 'ar', 'ja', 'ko', 'zh']
const RTL = new Set(['ar'])
const TODAY = new Date().toISOString().slice(0, 10)

const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))
const meta = json('src/data/words/meta.json')
const playable = meta.entries.filter((e) => e.grade !== 'C')
const CATEGORIES = Object.keys(meta.subs)

const locale = Object.fromEntries(LANGS.map((l) => [l, json(`src/i18n/locales/${l}.json`)]))
const words = Object.fromEntries(
  LANGS.map((l) => {
    const p = `src/data/words/${l}.json`
    return [l, json(existsSync(join(ROOT, p)) ? p : 'src/data/words/en.json')]
  }),
)

/** i18n lookup with {{var}} interpolation and English fallback. */
function t(lang, key, vars = {}) {
  const get = (obj) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
  let s = get(locale[lang]) ?? get(locale.en) ?? key
  for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v))
  return s
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const word = (lang, id) => words[lang].entries[id]?.word ?? words.en.entries[id].word
const inCategory = (cat) => playable.filter((e) => e.category === cat)

const STYLE = `
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#0a0a0c;color:#fafafa;font:17px/1.6 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
main{max-width:42rem;margin:0 auto;padding:1.5rem 1rem 7rem}
header{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:2rem}
header a{color:inherit;text-decoration:none;font-weight:700;display:flex;gap:.6rem;align-items:center}
h1{font-size:2rem;line-height:1.2;margin:0 0 .75rem;letter-spacing:-.02em}
h2{font-size:1.3rem;margin:2.5rem 0 .75rem}h3{font-size:1rem;margin:1.5rem 0 .4rem;color:#fafafa}
p,li{color:#b9b9c2}a{color:#f5b400}ol{padding-inline-start:1.3rem}li{margin:.5rem 0}
.card{background:#16161a;border:1px solid #27272c;border-radius:1rem;padding:1rem 1.25rem;margin:.75rem 0}
.card p{margin:.2rem 0}.ex{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.5rem}
.ex div{background:#212126;border-radius:.75rem;padding:.5rem .8rem}.ex small{display:block;color:#8d8d96;font-size:.8rem}
.cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:.75rem}
.cats a{display:block;text-decoration:none;color:#fafafa}.cats small{display:block;color:#8d8d96}
.words{display:flex;flex-wrap:wrap;gap:.4rem;padding:0;list-style:none}.words li{margin:0;background:#16161a;border:1px solid #27272c;border-radius:999px;padding:.2rem .8rem;color:#fafafa}
nav.langs{font-size:.85rem}nav.langs a{margin-inline-end:.6rem;color:#8d8d96}
.cta{position:fixed;left:0;right:0;bottom:0;padding:1rem 1rem max(env(safe-area-inset-bottom),1rem);background:linear-gradient(to top,#0a0a0c 70%,transparent)}
.cta a{display:block;max-width:40rem;margin:0 auto;text-align:center;background:#fafafa;color:#0a0a0c;font-weight:700;text-decoration:none;padding:.95rem;border-radius:1rem}`

/** Full HTML page with SEO head and the play button. */
function page({ lang, path, title, description, alternates, body, jsonLd }) {
  const links = alternates
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}" />`)
    .join('\n    ')
  return `<!doctype html>
<html lang="${lang}" dir="${RTL.has(lang) ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${SITE}${path}" />
    ${links}
    <link rel="alternate" hreflang="x-default" href="${SITE}${alternates.find((a) => a.lang === 'en').path}" />
    <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#0a0a0c" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${SITE}${path}" />
    <meta property="og:image" content="${SITE}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
    <style>${STYLE}</style>
  </head>
  <body>
    <main>
      <header>
        <a href="/${lang}/"><img src="/favicon.svg" alt="" width="36" height="36" /> Spy</a>
      </header>
${body}
      <nav class="langs">${LANGS.map((l) => `<a href="/${l}/" hreflang="${l}">${esc(t(l, `languages.${l}`))}</a>`).join('')}</nav>
      <p><a href="/privacy/">${esc(t(lang, 'options.privacy'))}</a></p>
    </main>
    <div class="cta"><a href="/?lang=${lang}">${esc(t(lang, 'seo.play'))}</a></div>
  </body>
</html>
`
}

function write(path, html) {
  const dir = join(DIST, path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

const sitemap = [] // { path, alternates }

for (const lang of LANGS) {
  const landingAlternates = LANGS.map((l) => ({ lang: l, path: `/${l}/` }))

  // Hint levels with the bakery example, in this language.
  const bakery = words[lang].entries.bakery ?? words.en.entries.bakery
  const bakerySub = words[lang].subs?.shop ?? words.en.subs.shop
  const examples = { word: bakery.sibling[0], close: bakery.associated[0], category: bakerySub, none: t(lang, 'card.noHint') }
  const hints = ['word', 'close', 'category', 'none']
    .map(
      (lvl) => `      <div class="card">
        <p><strong>${esc(t(lang, `hint.${lvl}.label`))}</strong>: ${esc(t(lang, `hint.${lvl}.desc`))}</p>
        <div class="ex"><div><small>${esc(t(lang, 'hint.exampleWord'))}</small>${esc(bakery.word)}</div><div><small>${esc(t(lang, 'hint.exampleHint'))}</small>${esc(examples[lvl])}</div></div>
      </div>`,
    )
    .join('\n')

  const cats = CATEGORIES.map((cat) => {
    const sample = inCategory(cat).slice(0, 4).map((e) => word(lang, e.id))
    return `        <a class="card" href="/${lang}/${cat}/"><strong>${esc(t(lang, `categories.${cat}.name`))}</strong><small>${esc(sample.join(', '))} …</small></a>`
  }).join('\n')

  write(
    lang,
    page({
      lang,
      path: `/${lang}/`,
      title: t(lang, 'seo.title'),
      description: t(lang, 'seo.description'),
      alternates: landingAlternates,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Spy',
        url: `${SITE}/${lang}/`,
        inLanguage: lang,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        description: t(lang, 'seo.description'),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      body: `      <h1>${esc(t(lang, 'seo.h1'))}</h1>
      <p>${esc(t(lang, 'seo.intro'))}</p>
      <h2>${esc(t(lang, 'rules.title'))}</h2>
      <ol>
${['s1', 's2', 's3', 's4'].map((s) => `        <li>${esc(t(lang, `rules.${s}`))}</li>`).join('\n')}
      </ol>
      <p>${esc(t(lang, 'rules.win'))}</p>
      <p>${esc(t(lang, 'rules.players'))}</p>
      <h2>${esc(t(lang, 'seo.hintTitle'))}</h2>
${hints}
      <h2>${esc(t(lang, 'seo.categoriesTitle'))}</h2>
      <div class="cats">
${cats}
      </div>`,
    }),
  )
  sitemap.push({ path: `/${lang}/`, alternates: landingAlternates })

  for (const cat of CATEGORIES) {
    const list = inCategory(cat)
    const name = t(lang, `categories.${cat}.name`)
    const alternates = LANGS.map((l) => ({ lang: l, path: `/${l}/${cat}/` }))
    const groups = meta.subs[cat]
      .map((sub) => {
        const ws = list.filter((e) => e.sub === sub).map((e) => word(lang, e.id))
        if (!ws.length) return ''
        const label = words[lang].subs?.[sub] ?? words.en.subs[sub]
        return `      <h3>${esc(label)}</h3>
      <ul class="words">${ws.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>`
      })
      .join('\n')
    const others = CATEGORIES.filter((c) => c !== cat)
      .map((c) => `<a href="/${lang}/${c}/">${esc(t(lang, `categories.${c}.name`))}</a>`)
      .join(' · ')
    write(
      `${lang}/${cat}`,
      page({
        lang,
        path: `/${lang}/${cat}/`,
        title: t(lang, 'seo.categoryTitle', { category: name }),
        description: t(lang, 'seo.categoryDescription', {
          count: list.length,
          description: t(lang, `categories.${cat}.description`),
        }),
        alternates,
        body: `      <h1>${esc(t(lang, 'seo.categoryTitle', { category: name }))}</h1>
      <p>${esc(t(lang, 'seo.categoryIntro', { count: list.length }))}</p>
${groups}
      <h2>${esc(t(lang, 'seo.moreCategories'))}</h2>
      <p>${others}</p>
      <p><a href="/${lang}/">${esc(t(lang, 'rules.title'))}</a></p>`,
      }),
    )
    sitemap.push({ path: `/${lang}/${cat}/`, alternates })
  }
}

const urls = [
  { path: '/', alternates: [] },
  { path: '/how-to-play/', alternates: [] },
  ...sitemap,
]
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE}${u.path}</loc>
    <lastmod>${TODAY}</lastmod>${u.alternates
      .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}" />`)
      .join('')}
  </url>`,
  )
  .join('\n')}
</urlset>
`,
)
console.log(`seo: ${sitemap.length} pages, sitemap with ${urls.length} urls`)
