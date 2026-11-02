import { describe, expect, it } from 'vitest'
import { guardAgainstTranslators } from './translateGuard'

/** Minimal stand-in for DOM nodes that throws like the real ones do. */
class FakeNode {
  parentNode: FakeNode | null = null
  childNodes: FakeNode[] = []

  readonly name: string

  constructor(name: string) {
    this.name = name
  }

  insertBefore(node: FakeNode, before: FakeNode | null) {
    if (before && before.parentNode !== this) throw new Error('NotFoundError')
    node.parentNode?.removeChild(node)
    const i = before ? this.childNodes.indexOf(before) : this.childNodes.length
    this.childNodes.splice(i, 0, node)
    node.parentNode = this
    return node
  }

  removeChild(child: FakeNode) {
    if (child.parentNode !== this) throw new Error('NotFoundError')
    this.childNodes.splice(this.childNodes.indexOf(child), 1)
    child.parentNode = null
    return child
  }

  append(...nodes: FakeNode[]) {
    for (const n of nodes) this.insertBefore(n, null)
    return this
  }

  get names() {
    return this.childNodes.map((n) => n.name)
  }
}

class GuardedNode extends FakeNode {}
guardAgainstTranslators(GuardedNode.prototype as unknown as Node)

/** What Google Translate does: put a <font> where the text node was and drop the text node. */
function translate(text: FakeNode) {
  const parent = text.parentNode!
  const font = new GuardedNode('font')
  parent.insertBefore(font, text)
  parent.removeChild(text)
  return font
}

describe('guardAgainstTranslators', () => {
  it('leaves normal inserts and removals alone', () => {
    const p = new GuardedNode('p')
    const a = new GuardedNode('a')
    const b = new GuardedNode('b')
    p.append(b)
    p.insertBefore(a, b)
    expect(p.names).toEqual(['a', 'b'])
    p.removeChild(a)
    expect(p.names).toEqual(['b'])
  })

  it('inserts before a reference node the translator removed, instead of throwing', () => {
    const p = new GuardedNode('p')
    const text = new GuardedNode('text')
    p.append(new GuardedNode('first'), text)
    translate(text)
    p.insertBefore(new GuardedNode('new'), text)
    expect(p.names).toEqual(['first', 'font', 'new'])
  })

  it('inserts before the wrapper when the reference node was wrapped', () => {
    const p = new GuardedNode('p')
    const text = new GuardedNode('text')
    p.append(text)
    const font = new GuardedNode('font')
    p.insertBefore(font, text)
    font.append(text)
    p.insertBefore(new GuardedNode('new'), text)
    expect(p.names).toEqual(['new', 'font'])
  })

  it('ignores removing a child the translator already removed', () => {
    const p = new GuardedNode('p')
    const text = new GuardedNode('text')
    p.append(text)
    translate(text)
    expect(p.removeChild(text)).toBe(text)
    expect(p.names).toEqual(['font'])
  })

  it('removes a wrapped child from its wrapper', () => {
    const p = new GuardedNode('p')
    const font = new GuardedNode('font')
    const text = new GuardedNode('text')
    p.append(font)
    font.append(text)
    p.removeChild(text)
    expect(font.names).toEqual([])
    expect(text.parentNode).toBeNull()
  })
})
