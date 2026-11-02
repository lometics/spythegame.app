/**
 * Browser translators (Google Translate in Chrome above all) swap the page's text
 * nodes for their own <font> elements. React still holds the old text nodes, so its
 * next insertBefore/removeChild throws NotFoundError and the whole screen goes blank.
 * These guards let both calls cope with nodes that were moved out from under React.
 * See https://github.com/facebook/react/issues/11538
 */

type NodeMethods = { insertBefore: Node['insertBefore']; removeChild: Node['removeChild'] }

export function guardAgainstTranslators(proto: NodeMethods = Node.prototype) {
  const { insertBefore, removeChild } = proto

  proto.insertBefore = function <T extends Node>(this: Node, node: T, before: Node | null): T {
    // Insert before whatever now stands where the reference node was; at the end if it's gone.
    let at = before
    while (at && at.parentNode !== this) at = at.parentNode
    return insertBefore.call(this, node, at) as T
  }

  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode === this) return removeChild.call(this, child) as T
    // Already detached, or wrapped by the translator: React only wants it gone.
    if (child.parentNode) removeChild.call(child.parentNode, child)
    return child
  }
}
