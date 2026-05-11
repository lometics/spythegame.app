const KEY = 'spy.playerName'

export function getStoredName(): string {
  try {
    return localStorage.getItem(KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function setStoredName(name: string) {
  try {
    localStorage.setItem(KEY, name.trim())
  } catch {
    /* ignore */
  }
}
