/**
 * Opens the phone's share sheet, or copies to the clipboard where there is
 * none (desktop). Returns what happened so the button can say "Copied".
 */
export async function shareOrCopy(data: { text?: string; url: string; title?: string }) {
  if (navigator.share) {
    try {
      await navigator.share(data)
      return 'shared' as const
    } catch (e) {
      // Closing the share sheet isn't an error worth reporting.
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled' as const
    }
  }
  try {
    await navigator.clipboard.writeText(data.text ? `${data.text} ${data.url}` : data.url)
    return 'copied' as const
  } catch {
    return 'failed' as const
  }
}
