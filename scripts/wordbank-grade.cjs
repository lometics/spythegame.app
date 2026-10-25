// Combine the reviews into one row per word and an A/B/C grade.
//   node scripts/wordbank-grade.cjs <reviewDir> report  -> issues per word (for fixing)
//   node scripts/wordbank-grade.cjs <reviewDir> apply   -> writes grade/review/difficulty into meta.json
// <reviewDir> holds key.json + guesses-*.json (critic export/score), siblings-verdict.json,
// suitability.json and optionally recheck.json ({ranks, siblings}) from a second pass.
const fs = require('fs')
const path = require('path')
const DIR = path.resolve(process.argv[2] ?? '.')
const wb = require('./wordbank-files.cjs')
const j = (f, fallback) => (fs.existsSync(path.join(DIR, f)) ? JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) : fallback)

const meta = wb.read('meta')
const en = wb.read('en')
const key = j('key.json', {})
const suit = Object.fromEntries(j('suitability.json', []).map((s) => [s.id, s]))
const sib = {}
for (const v of j('siblings-verdict.json', [])) (sib[v.id] ??= {})[v.b] = v
// Later passes (rechecks after fixes) override earlier verdicts for the same hint.
const recheck = j('recheck.json', {})

const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const hit = (w, g) => {
  const a = norm(w), b = norm(g)
  return a === b || b.includes(a) || a.includes(b) || a.replace(/s$/, '') === b.replace(/s$/, '')
}

// rank per (id, hint) from the blind guesses
const rank = {}
for (const f of fs.readdirSync(DIR).filter((f) => /^guesses-.*\.json$/.test(f))) {
  for (const [k, list] of Object.entries(j(f))) {
    const h = key[k]
    if (!h) continue
    const word = en.entries[h.id]?.word
    if (!word) continue
    ;(rank[h.id] ??= {})[h.hint] = list.findIndex((g) => hit(word, g)) + 1
  }
}
for (const [id, hints] of Object.entries(recheck.ranks ?? {})) Object.assign((rank[id] ??= {}), hints)
for (const [id, verdicts] of Object.entries(recheck.siblings ?? {})) Object.assign((sib[id] ??= {}), verdicts)

const rows = meta.entries.map((m) => {
  const e = en.entries[m.id]
  const s = suit[m.id] ?? {}
  const tested = !!rank[m.id]
  const misses = tested ? e.associated.filter((h) => rank[m.id][h] === 0) : []
  const badSibs = e.sibling.filter((b) => sib[m.id]?.[b] && sib[m.id][b].verdict !== 'good')
  const issues = []
  if (s.appropriate === false) issues.push(`not appropriate: ${s.note}`)
  if (s.known === 3) issues.push(`not widely known: ${s.note}`)
  if (s.known === 2) issues.push('known to most adults, not everyone')
  if (s.translates === false) issues.push(`translates poorly: ${s.note}`)
  if (s.playable === 3) issues.push(`hard to give clues for: ${s.note}`)
  if (s.playable === 2) issues.push('fewer clue angles')
  for (const h of misses) issues.push(`close hint "${h}" misleads (blind guess missed)`)
  for (const b of badSibs) issues.push(`decoy "${b}" is ${sib[m.id][b].verdict}`)
  let grade = 'A'
  if (s.known === 2 || s.translates === false || s.playable === 2 || misses.length === 1 || badSibs.length === 1) grade = 'B'
  if (s.appropriate === false || s.known === 3 || s.playable === 3 || misses.length >= 2 || badSibs.length === 2) grade = 'C'
  return { m, e, s, misses, badSibs, issues, grade }
})

const mode = process.argv[3]
if (mode === 'report') {
  for (const r of rows.filter((r) => r.misses.length || r.badSibs.length)) {
    console.log(`${r.m.id}\t${r.m.category}\t${r.e.word}\tmiss: ${r.misses.join(', ')}\tbad decoys: ${r.badSibs.map((b) => `${b} (${sib[r.m.id][b].verdict})`).join(', ')}`)
  }
}
if (mode === 'apply') {
  for (const r of rows) {
    r.m.grade = r.grade
    if (r.s.known) r.m.difficulty = r.s.known
    if (r.grade === 'A') delete r.m.review
    else r.m.review = r.issues.join('; ')
  }
  wb.writeMeta(meta)
}
const count = (g) => rows.filter((r) => r.grade === g).length
console.log(`A ${count('A')}, B ${count('B')}, C ${count('C')}; hint misses ${rows.reduce((n, r) => n + r.misses.length, 0)}, bad decoys ${rows.reduce((n, r) => n + r.badSibs.length, 0)}`)
