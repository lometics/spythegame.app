// Just enough Markdown for the guide pages in content/guides/: a frontmatter
// block, #/##/### headings, paragraphs, - and 1. lists, **bold** and [links](/x/).

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Splits `---\nkey: value\n---\nbody` into its fields and the Markdown body. */
export function parseFrontmatter(src) {
  const m = src.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: src }
  const data = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { data, body: m[2] }
}

function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
}

/** Markdown body to HTML. */
export function markdownToHtml(md) {
  const out = []
  const blocks = md.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/)
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim())
    const heading = lines[0].match(/^(#{1,3})\s+(.*)$/)
    if (heading && lines.length === 1) {
      const n = heading[1].length
      out.push(`<h${n}>${inline(heading[2])}</h${n}>`)
    } else if (lines.every((l) => /^- /.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`)
    } else if (lines.every((l) => /^\d+\. /.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`)
    } else {
      out.push(`<p>${inline(lines.join(' '))}</p>`)
    }
  }
  return out.join('\n')
}
