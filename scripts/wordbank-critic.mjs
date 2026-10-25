// Blind critic pass for the word bank (see docs/word-bank.md, step 4).
//
//   node scripts/wordbank-critic.mjs export <outDir> [category...]
//     writes hints-<category>.tsv (shuffled, words hidden), siblings.tsv and key.json
//   node scripts/wordbank-critic.mjs score <outDir> [category...]
//     reads guesses-<category>.json ({key: [5 guesses]}) and prints where the
//     real word landed for each associated hint
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const meta = JSON.parse(fs.readFileSync(path.join(root, 'src/data/words/meta.json'), 'utf8'))
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/data/words/en.json'), 'utf8'))

const [cmd, outDir, ...cats] = process.argv.slice(2)
if (!['export', 'score'].includes(cmd) || !outDir) {
  console.error('usage: wordbank-critic.mjs export|score <outDir> [category...]')
  process.exit(1)
}
const categories = cats.length ? cats : Object.keys(meta.subs)
const entries = meta.entries.filter((e) => categories.includes(e.category))

const norm = (s) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Guess counts as a hit when it equals the word or contains it (or the reverse). */
const hit = (word, guess) => {
  const w = norm(word)
  const g = norm(guess)
  return w === g || g.includes(w) || w.includes(g) || w.replace(/s$/, '') === g.replace(/s$/, '')
}

if (cmd === 'export') {
  fs.mkdirSync(outDir, { recursive: true })
  const key = {}
  const sib = []
  let n = 0
  for (const cat of categories) {
    const lines = []
    for (const e of entries.filter((x) => x.category === cat)) {
      const t = en.entries[e.id]
      for (const h of t.associated) {
        const k = `h${++n}`
        key[k] = { id: e.id, hint: h }
        lines.push(`${k}\t${h}`)
      }
      for (const s of t.sibling) sib.push(`${e.id}\t${t.word}\t${s}`)
    }
    lines.sort(() => Math.random() - 0.5)
    fs.writeFileSync(path.join(outDir, `hints-${cat}.tsv`), lines.join('\n'))
  }
  fs.writeFileSync(path.join(outDir, 'key.json'), JSON.stringify(key, null, 1))
  fs.writeFileSync(path.join(outDir, 'siblings.tsv'), sib.join('\n'))
  console.log(`exported ${n} hints, ${sib.length} sibling pairs to ${outDir}`)
} else {
  const key = JSON.parse(fs.readFileSync(path.join(outDir, 'key.json'), 'utf8'))
  const rows = []
  for (const cat of categories) {
    const guesses = JSON.parse(fs.readFileSync(path.join(outDir, `guesses-${cat}.json`), 'utf8'))
    for (const [k, list] of Object.entries(guesses)) {
      const { id, hint } = key[k]
      const word = en.entries[id].word
      const rank = list.findIndex((g) => hit(word, g)) + 1
      rows.push({ id, word, hint, rank, list })
    }
  }
  // rank 1 = direct (spy lands it), 2-5 = needs thought, 0 = miss (misleading or too vague)
  const label = (r) => (r === 1 ? 'direct' : r === 0 ? 'MISS' : 'ok')
  rows.sort((a, b) => a.id.localeCompare(b.id))
  for (const r of rows) {
    console.log(`${label(r.rank).padEnd(9)} ${r.word.padEnd(16)} ${r.hint.padEnd(20)} #${r.rank || '-'}  ${r.list.join(', ')}`)
  }
  const count = (f) => rows.filter(f).length
  console.log(`\n${rows.length} hints: direct ${count((r) => r.rank === 1)}, ok ${count((r) => r.rank > 1)}, miss ${count((r) => r.rank === 0)}`)
}
