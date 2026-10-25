/**
 * Sends uncaught errors to the database (`errors/`, write-only, see rules.json)
 * so crashes on players' phones show up somewhere. Firebase is only loaded once
 * an error actually happens.
 */

const MAX_PER_PAGE = 5

/** Noise that isn't ours to fix. */
const IGNORED = [/ResizeObserver loop/i, /chrome-extension:\/\//, /moz-extension:\/\//, /Script error\.?$/]

/** Decides which errors get sent: no duplicates, no noise, at most a few per page load. */
export function createReportFilter(max = MAX_PER_PAGE) {
  const seen = new Set<string>()
  return (msg: string, stack = ''): boolean => {
    if (!msg || IGNORED.some((re) => re.test(msg) || re.test(stack))) return false
    const key = `${msg}|${stack.split('\n')[1] ?? ''}`
    if (seen.has(key) || seen.size >= max) return false
    seen.add(key)
    return true
  }
}

const shouldReport = createReportFilter()

async function report(msg: string, stack?: string) {
  if (!import.meta.env.PROD || !shouldReport(msg, stack)) return
  try {
    const { db, ensureSignedIn } = await import('./online/firebase')
    if (!db) return
    const { push, ref, serverTimestamp } = await import('firebase/database')
    await ensureSignedIn()
    await push(ref(db, 'errors'), {
      msg: msg.slice(0, 500),
      ...(stack ? { stack: stack.slice(0, 2000) } : {}),
      url: location.pathname.slice(0, 300),
      ua: navigator.userAgent.slice(0, 300),
      at: serverTimestamp(),
    })
  } catch {
    // Reporting must never cause errors of its own.
  }
}

export function installErrorReporting() {
  window.addEventListener('error', (e) => {
    report(e.message, e.error instanceof Error ? e.error.stack : undefined)
  })
  window.addEventListener('unhandledrejection', (e) => {
    const r: unknown = e.reason
    report(r instanceof Error ? r.message : String(r), r instanceof Error ? r.stack : undefined)
  })
}
