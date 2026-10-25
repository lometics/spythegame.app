export type RawPair = { civilian: string; spy: string; categoryId: string }

// Word lists are big, so each language is its own chunk, loaded on demand.
const loaders = import.meta.glob<{ default: { pairs: RawPair[] } }>('./pairs.*.json')
const cache: Record<string, RawPair[]> = {}

function loaderFor(lng: string) {
  return loaders[`./pairs.${lng}.json`]
}

/** Languages without their own word list play with the English one. */
export function pairLanguage(lng: string): string {
  return loaderFor(lng) ? lng : 'en'
}

export async function loadPairs(lng: string): Promise<void> {
  const key = pairLanguage(lng)
  if (cache[key]) return
  cache[key] = (await loaderFor(key)()).default.pairs
}

export function getPairs(lng: string): RawPair[] {
  return cache[pairLanguage(lng)] ?? cache.en ?? []
}
