import { describe, expect, it } from 'vitest'
import { markdownToHtml, parseFrontmatter } from './markdown.mjs'

describe('parseFrontmatter', () => {
  it('reads fields and the body', () => {
    const { data, body } = parseFrontmatter('---\nslug: tips\ntitle: Tips: win more\n---\n# Hi\n')
    expect(data).toEqual({ slug: 'tips', title: 'Tips: win more' })
    expect(body).toBe('# Hi\n')
  })

  it('handles Windows line endings', () => {
    expect(parseFrontmatter('---\r\nslug: a\r\n---\r\nx').data).toEqual({ slug: 'a' })
  })

  it('returns the whole text when there is no frontmatter', () => {
    expect(parseFrontmatter('# Hi')).toEqual({ data: {}, body: '# Hi' })
  })
})

describe('markdownToHtml', () => {
  it('renders headings, paragraphs and lists', () => {
    const html = markdownToHtml('# Title\n\nOne\ntwo.\n\n- a\n- b\n\n1. x\n2. y\n\n### Sub')
    expect(html).toBe(
      '<h1>Title</h1>\n<p>One two.</p>\n<ul><li>a</li><li>b</li></ul>\n<ol><li>x</li><li>y</li></ol>\n<h3>Sub</h3>',
    )
  })

  it('renders bold and links', () => {
    expect(markdownToHtml('**Spy** wins, see [rules](/en/).')).toBe(
      '<p><strong>Spy</strong> wins, see <a href="/en/">rules</a>.</p>',
    )
  })

  it('escapes HTML', () => {
    expect(markdownToHtml('a <b> & "c"')).toBe('<p>a &lt;b&gt; &amp; &quot;c&quot;</p>')
  })

  it('treats a line starting with a hyphen inside text as a paragraph', () => {
    expect(markdownToHtml('Intro:\n- a')).toBe('<p>Intro: - a</p>')
  })
})
