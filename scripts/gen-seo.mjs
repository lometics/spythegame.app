// Generates static, crawlable pages into dist/ after `vite build`:
//   /<lang>/            landing page per language (rules, hint levels, categories, guides)
//   /<lang>/<category>/ every playable word of a word bank category, with the spy's words
//   /<lang>/<guide>/    guides written in content/guides/<id>/<lang>.md
//   /404.html           page for unknown URLs
//   /sitemap.xml        all of the above with hreflang alternates
// It also adds the hreflang links to the app's own index.html, the x-default page.
// Texts come from the app's locale files (keys under "seo", "rules", "hint",
// "categories") and the word bank, so pages stay in sync with the game.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { markdownToHtml, parseFrontmatter } from './markdown.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE = 'https://spythegame.app'
const LANGS = ['en', 'de', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'sv', 'tr', 'ru', 'ar', 'ja', 'ko', 'zh']
const RTL = new Set(['ar'])
/** Same as SEASONS in src/game/season.ts. */
const SEASONAL = ['halloween', 'christmas', 'easter', 'summer']

const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))
const meta = json('src/data/words/meta.json')
const playable = meta.entries.filter((e) => e.grade !== 'C')
const CATEGORIES = Object.keys(meta.subs)

const wordsFile = (l) => (existsSync(join(ROOT, `src/data/words/${l}.json`)) ? `src/data/words/${l}.json` : 'src/data/words/en.json')
const locale = Object.fromEntries(LANGS.map((l) => [l, json(`src/i18n/locales/${l}.json`)]))
const words = Object.fromEntries(LANGS.map((l) => [l, json(wordsFile(l))]))

/** i18n lookup with {{var}} interpolation and English fallback. */
function t(lang, key, vars = {}) {
  const get = (obj) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
  let s = get(locale[lang]) ?? get(locale.en) ?? key
  for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v))
  return s
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const entry = (lang, id) => words[lang].entries[id] ?? words.en.entries[id]
const inCategory = (cat) => playable.filter((e) => e.category === cat)

/**
 * Date of the last commit that touched these files, for the sitemap. Unknown
 * (null) without git or when the commit is the cut-off of a shallow clone,
 * whose date says nothing about when the file changed.
 */
const lastChanged = (() => {
  const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  let shallow = new Set()
  try {
    const p = join(ROOT, git('rev-parse', '--git-path', 'shallow'))
    if (existsSync(p)) shallow = new Set(readFileSync(p, 'utf8').split('\n').filter(Boolean))
  } catch {
    return () => null
  }
  const cache = new Map()
  return (...files) => {
    const key = files.join('|')
    if (!cache.has(key)) {
      const [sha, date] = git('log', '-1', '--format=%H %cs', '--', ...files).split(' ')
      cache.set(key, sha && !shallow.has(sha) ? date : null)
    }
    return cache.get(key)
  }
})()

const GENERATOR = relative(ROOT, fileURLToPath(import.meta.url))
const langSources = (lang) => [GENERATOR, `src/i18n/locales/${lang}.json`, wordsFile(lang), 'src/data/words/meta.json']

/** Guides: content/guides/<id>/<lang>.md with slug, title, description and optional category. */
const GUIDES_DIR = join(ROOT, 'content/guides')
const guides = readdirSync(GUIDES_DIR).flatMap((id) =>
  readdirSync(join(GUIDES_DIR, id))
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const lang = f.slice(0, -3)
      const file = `content/guides/${id}/${f}`
      const { data, body } = parseFrontmatter(readFileSync(join(ROOT, file), 'utf8'))
      if (!LANGS.includes(lang)) throw new Error(`${file}: unknown language`)
      if (!data.slug || !data.title || !data.description) throw new Error(`${file}: needs slug, title and description`)
      if (CATEGORIES.includes(data.slug)) throw new Error(`${file}: slug "${data.slug}" is taken by a category`)
      return { id, lang, file, ...data, path: `/${lang}/${data.slug}/`, body }
    }),
)
const guidesIn = (lang) => guides.filter((g) => g.lang === lang)

const STYLE = `
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#0a0a0c;color:#fafafa;font:17px/1.6 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
main{max-width:42rem;margin:0 auto;padding:1.5rem 1rem 7rem}
header{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:2rem}
header a{color:inherit;text-decoration:none;font-weight:700;display:flex;gap:.6rem;align-items:center}
h1{font-size:2rem;line-height:1.2;margin:0 0 .75rem;letter-spacing:-.02em}
h2{font-size:1.3rem;margin:2.5rem 0 .75rem}h3{font-size:1rem;margin:1.5rem 0 .4rem;color:#fafafa}
p,li{color:#b9b9c2}strong{color:#fafafa}a{color:#f5b400}ol,ul{padding-inline-start:1.3rem}li{margin:.5rem 0}
.card{background:#16161a;border:1px solid #27272c;border-radius:1rem;padding:1rem 1.25rem;margin:.75rem 0}
.card p{margin:.2rem 0}.ex{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.5rem}
.ex div{background:#212126;border-radius:.75rem;padding:.5rem .8rem}.ex small{display:block;color:#8d8d96;font-size:.8rem}
.cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:.75rem}
.cats a{display:block;margin:0;text-decoration:none;color:#fafafa}.cats small{display:block;color:#8d8d96}
.links{padding:0;list-style:none}.links li{margin:.4rem 0}
table{width:100%;border-collapse:collapse;font-size:.95rem}th,td{text-align:start;padding:.45rem .5rem;border-bottom:1px solid #27272c}
th{color:#8d8d96;font-weight:600;font-size:.8rem}td:first-child{color:#fafafa;font-weight:600}td{color:#b9b9c2}
.copy{font:inherit;font-size:.9rem;background:#212126;color:#fafafa;border:1px solid #27272c;border-radius:999px;padding:.4rem 1rem;cursor:pointer}
nav.langs{font-size:.85rem;display:flex;flex-wrap:wrap;gap:.2rem .8rem}nav.langs a{color:#8d8d96}
.cta{position:fixed;left:0;right:0;bottom:0;padding:1rem 1rem max(env(safe-area-inset-bottom),1rem);background:linear-gradient(to top,#0a0a0c 70%,transparent)}
.cta a{display:block;max-width:40rem;margin:0 auto;text-align:center;background:#fafafa;color:#0a0a0c;font-weight:700;text-decoration:none;padding:.95rem;border-radius:1rem}
@media print{body{background:#fff;color:#000}p,li,td,th,h3,strong,td:first-child{color:#000}.cta,.copy,nav.langs,header{display:none}main{padding:0}th,td{border-color:#ccc}}`

/** hreflang links for a set of language versions; x-default is the page for everyone else. */
const hreflang = (alternates, xDefault) =>
  [
    ...alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}" />`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${xDefault}" />`,
  ].join('\n    ')

/** Full HTML page with SEO head and the play button. */
function page({ lang, path, title, description, alternates, xDefault, body, jsonLd, script }) {
  return `<!doctype html>
<html lang="${lang}" dir="${RTL.has(lang) ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${SITE}${path}" />
    ${hreflang(alternates, xDefault)}
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
    <div class="cta"><a href="/?lang=${lang}">${esc(t(lang, 'seo.play'))}</a></div>${script ? `\n    <script>${script}</script>` : ''}
  </body>
</html>
`
}

function write(path, html) {
  const dir = join(DIST, path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

/** Copies the word table as tab-separated text (pastes into sheets and notes alike). */
const COPY_SCRIPT = `(function(){var b=document.querySelector('.copy');if(!navigator.clipboard){b.remove();return}
b.onclick=function(){var trs=[document.querySelector('thead tr')].concat([].slice.call(document.querySelectorAll('tbody tr')));
var rows=trs.map(function(r){return [].map.call(r.cells,function(c){return c.textContent}).join('\\t')});
navigator.clipboard.writeText(rows.join('\\n')).then(function(){b.textContent=b.dataset.done})}})()`

const LANDING = LANGS.map((l) => ({ lang: l, path: `/${l}/` }))
const sitemap = [{ path: '/', alternates: LANDING, xDefault: '/', lastmod: lastChanged('index.html', GENERATOR) }]

const categoryCard = (lang, cat) => {
  const sample = inCategory(cat).slice(0, 4).map((e) => entry(lang, e.id).word)
  return `        <a class="card" href="/${lang}/${cat}/"><strong>${esc(t(lang, `categories.${cat}.name`))}</strong><small>${esc(sample.join(', '))} …</small></a>`
}
const guideLinks = (list) =>
  `      <ul class="links">${list.map((g) => `<li><a href="${g.path}">${esc(g.title)}</a></li>`).join('')}</ul>`

for (const lang of LANGS) {
  const lastmod = lastChanged(...langSources(lang))

  // Hint levels with the bakery example, in this language.
  const bakery = entry(lang, 'bakery')
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

  const regular = CATEGORIES.filter((c) => !SEASONAL.includes(c))
  const seasonal = CATEGORIES.filter((c) => SEASONAL.includes(c))
  const langGuides = guidesIn(lang)

  write(
    lang,
    page({
      lang,
      path: `/${lang}/`,
      title: t(lang, 'seo.title'),
      description: t(lang, 'seo.description'),
      alternates: LANDING,
      xDefault: '/',
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
${langGuides.length ? `      <h2>${esc(t(lang, 'seo.guidesTitle'))}</h2>\n${guideLinks(langGuides)}\n` : ''}      <h2>${esc(t(lang, 'seo.categoriesTitle'))}</h2>
      <div class="cats">
${regular.map((c) => categoryCard(lang, c)).join('\n')}
      </div>
      <h2>${esc(t(lang, 'seo.seasonalTitle'))}</h2>
      <div class="cats">
${seasonal.map((c) => categoryCard(lang, c)).join('\n')}
      </div>`,
    }),
  )
  sitemap.push({ path: `/${lang}/`, alternates: LANDING, xDefault: '/', lastmod })

  for (const cat of CATEGORIES) {
    const list = inCategory(cat)
    const name = t(lang, `categories.${cat}.name`)
    const alternates = LANGS.map((l) => ({ lang: l, path: `/${l}/${cat}/` }))
    const head = `<tr><th>${esc(t(lang, 'hint.exampleWord'))}</th><th>${esc(t(lang, 'hint.word.label'))}</th><th>${esc(t(lang, 'hint.close.label'))}</th></tr>`
    const groups = meta.subs[cat]
      .map((sub) => {
        const rows = list
          .filter((e) => e.sub === sub)
          .map((e) => entry(lang, e.id))
          .map((w) => `<tr><td>${esc(w.word)}</td><td>${esc(w.sibling[0] ?? '')}</td><td>${esc(w.associated[0] ?? '')}</td></tr>`)
        if (!rows.length) return ''
        const label = words[lang].subs?.[sub] ?? words.en.subs[sub]
        return `      <h3>${esc(label)}</h3>
      <table><thead>${head}</thead><tbody>${rows.join('')}</tbody></table>`
      })
      .join('\n')
    const others = CATEGORIES.filter((c) => c !== cat)
      .map((c) => `<a href="/${lang}/${c}/">${esc(t(lang, `categories.${c}.name`))}</a>`)
      .join(' · ')
    const related = guidesIn(lang).filter((g) => g.category === cat)
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
        xDefault: `/en/${cat}/`,
        script: COPY_SCRIPT,
        body: `      <h1>${esc(t(lang, 'seo.categoryTitle', { category: name }))}</h1>
      <p>${esc(t(lang, 'seo.categoryIntro', { count: list.length }))}</p>
      <p>${esc(t(lang, 'seo.categoryHowTo'))}</p>
      <p><button type="button" class="copy" data-done="${esc(t(lang, 'seo.copied'))}">${esc(t(lang, 'seo.copyWords'))}</button></p>
${groups}
${related.length ? `      <h2>${esc(t(lang, 'seo.guidesTitle'))}</h2>\n${guideLinks(related)}\n` : ''}      <h2>${esc(t(lang, 'seo.moreCategories'))}</h2>
      <p>${others}</p>
      <p><a href="/${lang}/">${esc(t(lang, 'rules.title'))}</a></p>`,
      }),
    )
    sitemap.push({ path: `/${lang}/${cat}/`, alternates, xDefault: `/en/${cat}/`, lastmod })
  }
}

for (const g of guides) {
  const versions = guides.filter((o) => o.id === g.id)
  const alternates = versions.map((o) => ({ lang: o.lang, path: o.path }))
  const xDefault = (versions.find((o) => o.lang === 'en') ?? g).path
  const more = guidesIn(g.lang).filter((o) => o.id !== g.id)
  write(
    g.path.slice(1, -1),
    page({
      lang: g.lang,
      path: g.path,
      title: g.title,
      description: g.description,
      alternates,
      xDefault,
      body: `${markdownToHtml(g.body)}
${more.length ? `      <h2>${esc(t(g.lang, 'seo.guidesTitle'))}</h2>\n${guideLinks(more)}\n` : ''}      <p><a href="/${g.lang}/">${esc(t(g.lang, 'rules.title'))}</a></p>`,
    }),
  )
  sitemap.push({ path: g.path, alternates, xDefault, lastmod: lastChanged(g.file, GENERATOR, 'scripts/markdown.mjs') })
}

// The app's start page is the x-default: it picks the language itself.
const indexPath = join(DIST, 'index.html')
const indexHtml = readFileSync(indexPath, 'utf8')
if (!indexHtml.includes('hreflang=')) {
  writeFileSync(indexPath, indexHtml.replace('</head>', `  ${hreflang(LANDING, '/')}\n  </head>`))
}

// Vercel serves this, with status 404, for every URL that is neither a file nor an app route.
writeFileSync(
  join(DIST, '404.html'),
  page({
    lang: 'en',
    path: '/404.html',
    title: 'Page not found – Spy',
    description: 'This page does not exist.',
    alternates: [],
    xDefault: '/',
    body: `      <h1>Page not found</h1>
      <p>This page does not exist. Maybe the link is old, or a room code got mistyped.</p>
      <p><a href="/">Open the game</a> or read <a href="/en/">how to play</a>.</p>`,
  })
    .replace(/\n\s*<link rel="(canonical|alternate)"[^>]*>/g, '')
    .replace('<meta name="description"', '<meta name="robots" content="noindex" />\n    <meta name="description"'),
)

writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap
  .map(
    (u) => `  <url>
    <loc>${SITE}${u.path}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${[
      ...u.alternates,
      { lang: 'x-default', path: u.xDefault },
    ]
      .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}" />`)
      .join('')}
  </url>`,
  )
  .join('\n')}
</urlset>
`,
)
console.log(`seo: ${sitemap.length} urls (${guides.length} guides), ${sitemap.filter((u) => u.lastmod).length} with lastmod`)
