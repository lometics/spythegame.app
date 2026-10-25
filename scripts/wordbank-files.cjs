// Word bank file helpers: read/write meta.json and <lang>.json in the repo's
// one-entry-per-line layout (blank line between categories).
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'src', 'data', 'words')
const file = (name) => path.join(ROOT, name + '.json')
const read = (name) => JSON.parse(fs.readFileSync(file(name), 'utf8'))

const one = (o) =>
  JSON.stringify(o)
    .replace(/^\{/, '{ ')
    .replace(/\}$/, ' }')
    .replace(/":/g, '": ')
    .replace(/,"/g, ', "')
    .replace(/","/g, '", "')

function writeMeta(meta) {
  const subs = Object.entries(meta.subs)
    .map(([c, list]) => `    ${JSON.stringify(c)}: ${JSON.stringify(list).replace(/","/g, '", "')}`)
    .join(',\n')
  let prev = null
  const lines = meta.entries.map((e) => {
    const gap = prev !== null && prev !== e.category ? '\n' : ''
    prev = e.category
    return gap + '    ' + one(e)
  })
  fs.writeFileSync(
    file('meta'),
    `{\n  "subs": {\n${subs}\n  },\n  "entries": [\n${lines.join(',\n')}\n  ]\n}\n`,
  )
}

function writeLang(lang, data, meta) {
  const subs = Object.entries(data.subs)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n')
  const cat = Object.fromEntries(meta.entries.map((e) => [e.id, e.category]))
  let prev = null
  const ids = meta.entries.map((e) => e.id).filter((id) => data.entries[id])
  const lines = ids.map((id) => {
    const gap = prev !== null && prev !== cat[id] ? '\n' : ''
    prev = cat[id]
    return gap + `    ${JSON.stringify(id)}: ${one(data.entries[id])}`
  })
  fs.writeFileSync(
    file(lang),
    `{\n  "subs": {\n${subs}\n  },\n  "entries": {\n${lines.join(',\n')}\n  }\n}\n`,
  )
}

module.exports = { read, writeMeta, writeLang }
