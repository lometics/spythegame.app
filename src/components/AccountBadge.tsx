import type { Account } from '../game/types'

/** Round initial for the signed-in account (no Google photo: that would load from Google on every visit). */
export default function AccountBadge({ account, size = 32 }: { account: Account; size?: number }) {
  const initial = (account.name || account.email || '?').trim().charAt(0).toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-background"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
