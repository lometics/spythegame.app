import { Egg, Flower2, Ghost, Gift, type LucideIcon } from 'lucide-react'
import { currentSeason } from '../game/season'

// Fixed positions so the snow looks the same on every render.
const FLAKES = [
  [6, 0, 11], [14, 4, 9], [23, 1.5, 13], [31, 6, 10], [42, 3, 12], [51, 0.5, 9],
  [60, 5, 11], [68, 2, 14], [77, 7, 10], [85, 1, 12], [93, 4.5, 9], [37, 8, 13],
] as const

/**
 * Light seasonal touches behind the home screen. Purely decorative: no
 * clicks, hidden from screen readers, and still when reduced motion is on.
 */
export default function SeasonalDecor() {
  const season = currentSeason()
  if (!season) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden text-accent">
      {season === 'halloween' && <Halloween />}
      {season === 'christmas' && <Christmas />}
      {season === 'easter' && <Easter />}
      {season === 'summer' && (
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      )}
    </div>
  )
}

function Halloween() {
  return (
    <>
      <svg viewBox="0 0 120 120" className="absolute left-0 top-0 h-28 w-28 opacity-[0.12]" fill="none" stroke="currentColor" strokeWidth="1.2">
        {/* threads from the corner and the rings between them */}
        <path d="M0 0 L120 30 M0 0 L95 75 M0 0 L60 110 M0 0 L20 120" />
        <path d="M38 10 Q34 22 30 30 Q22 36 12 38" />
        <path d="M74 19 Q66 40 58 46 Q44 62 30 70 Q22 72 14 74" />
        <path d="M108 28 Q96 58 86 68 Q66 88 50 94 Q36 104 18 110" />
      </svg>
      <Ghost size={22} className="decor-float absolute right-[12%] top-[14%] opacity-[0.18]" />
      <Ghost size={16} className="decor-float absolute left-[18%] top-[62%] opacity-[0.12] [animation-delay:-3s]" />
    </>
  )
}

function Christmas() {
  return (
    <>
      {FLAKES.map(([left, delay, duration], i) => (
        <span
          key={i}
          className="decor-snow absolute top-0 h-1.5 w-1.5 rounded-full bg-foreground/25"
          style={{ left: `${left}%`, animationDelay: `-${delay}s`, animationDuration: `${duration}s` }}
        />
      ))}
      <Gift size={18} className="absolute right-[10%] top-[16%] opacity-[0.14]" />
    </>
  )
}

function Easter() {
  const icons: [LucideIcon, string][] = [
    [Egg, 'right-[10%] top-[14%] rotate-12'],
    [Flower2, 'left-[8%] top-[22%] -rotate-6'],
    [Egg, 'left-[14%] bottom-[18%] -rotate-12'],
    [Flower2, 'right-[16%] bottom-[24%] rotate-6'],
  ]
  return (
    <>
      {icons.map(([Icon, pos], i) => (
        <Icon key={i} size={18} className={`absolute opacity-[0.14] ${pos}`} />
      ))}
    </>
  )
}
