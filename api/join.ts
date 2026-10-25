// Invite links (/join/ABCD, see vercel.json) get their own link preview in
// WhatsApp, iMessage & co: "Join my Spy game, room ABCD" in the inviter's
// language (?l=de). Everything else is the normal app page, which opens the room.
import en from '../src/i18n/locales/en.json'
import de from '../src/i18n/locales/de.json'
import fr from '../src/i18n/locales/fr.json'
import it from '../src/i18n/locales/it.json'
import es from '../src/i18n/locales/es.json'
import pt from '../src/i18n/locales/pt.json'
import nl from '../src/i18n/locales/nl.json'
import pl from '../src/i18n/locales/pl.json'
import sv from '../src/i18n/locales/sv.json'
import tr from '../src/i18n/locales/tr.json'
import ru from '../src/i18n/locales/ru.json'
import ar from '../src/i18n/locales/ar.json'
import ja from '../src/i18n/locales/ja.json'
import ko from '../src/i18n/locales/ko.json'
import zh from '../src/i18n/locales/zh.json'

type Share = { invite: string; inviteDescription: string }
const LOCALES: Record<string, { share?: Partial<Share> }> = { en, de, fr, it, es, pt, nl, pl, sv, tr, ru, ar, ja, ko, zh }

type Req = { query: Record<string, string | string[] | undefined>; headers: Record<string, string | string[] | undefined> }
type Res = { setHeader(name: string, value: string): void; status(code: number): Res; send(body: string): void }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

/** Replaces the content of one meta tag (by property or name) in the page. */
function setMeta(html: string, key: string, value: string) {
  const re = new RegExp(`(<meta\\s+(?:property|name)="${key}"\\s+content=")[^"]*(")`)
  return html.replace(re, `$1${esc(value)}$2`)
}

/** The app page with the invite's title and description for link previews. */
export function inviteHtml(page: string, rawCode: string, rawLang: string): string {
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  const lang = LOCALES[rawLang] ? rawLang : 'en'
  const text = (key: keyof Share) =>
    (LOCALES[lang].share?.[key] ?? en.share[key]).split('{{code}}').join(code)

  // Multi-line meta tags in index.html are normalised first so setMeta finds them.
  let html = page
  html = html.replace(/<meta\s+(property|name)="([^"]+)"\s+content="/g, '<meta $1="$2" content="')
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(text('invite'))}</title>`)
  for (const key of ['og:title', 'twitter:title']) html = setMeta(html, key, text('invite'))
  for (const key of ['description', 'og:description', 'twitter:description']) {
    html = setMeta(html, key, text('inviteDescription'))
  }
  return setMeta(html, 'og:url', `https://spythegame.app/join/${code}`)
}

export default async function handler(req: Req, res: Res) {
  const host = first(req.headers['x-forwarded-host']) || first(req.headers.host) || 'spythegame.app'
  const page = await fetch(`https://${host}/index.html`).then((r) => r.text())
  const html = inviteHtml(page, first(req.query.code), first(req.query.l))

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600')
  res.status(200).send(html)
}
