import type { CustomList } from './types'

/**
 * A custom word list packed into a link: /list#<data>. The data is base64url
 * JSON in the URL fragment, so it never reaches a server and needs no backend.
 */

type Packed = { n: string; i: string; p: [string, string][] }

export type SharedList = Pick<CustomList, 'name' | 'icon' | 'pairs'>

const MAX_PAIRS = 200
const MAX_TEXT = 60

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(data: string): string {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function listLink(origin: string, list: SharedList): string {
  const packed: Packed = {
    n: list.name,
    i: list.icon,
    p: list.pairs.map((p) => [p.civilian, p.spy]),
  }
  return `${origin}/list#${toBase64Url(JSON.stringify(packed))}`
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, MAX_TEXT) : '')

/** The list in a link's fragment, or null if it's missing, broken or empty. */
export function readListLink(hash: string): SharedList | null {
  try {
    const raw = JSON.parse(fromBase64Url(hash.replace(/^#/, ''))) as Partial<Packed>
    const pairs = (Array.isArray(raw.p) ? raw.p : [])
      .slice(0, MAX_PAIRS)
      .map((p) => (Array.isArray(p) ? { civilian: text(p[0]), spy: text(p[1]) } : null))
      .filter((p): p is { civilian: string; spy: string } => !!p && !!p.civilian && !!p.spy)
    const name = text(raw.n)
    if (!name || pairs.length === 0) return null
    return { name, icon: text(raw.i), pairs }
  } catch {
    return null
  }
}
