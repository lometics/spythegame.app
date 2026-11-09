import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AVATARS } from '../data/avatars'

const MARGIN = 8

/**
 * A player's picture as a button; tapping it opens a small popup of the preset
 * pictures next to it. Picking one, tapping elsewhere or Escape closes it.
 */
export function AvatarButton({
  name,
  avatar,
  onPick,
  className = '',
}: {
  name: string
  avatar: string
  onPick: (avatar: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  return (
    <>
      <button
        type="button"
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        aria-label={t('players.changeAvatar')}
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        className={`shrink-0 overflow-hidden rounded-full border bg-surface-2 active:scale-95 ${
          anchor ? 'border-accent' : 'border-border'
        } ${className}`}
      >
        <img src={avatar} alt="" className="h-full w-full" />
      </button>
      {anchor && (
        <AvatarPopup
          anchor={anchor}
          name={name}
          current={avatar}
          onPick={(a) => {
            onPick(a)
            setAnchor(null)
          }}
          onClose={() => setAnchor(null)}
        />
      )}
    </>
  )
}

function AvatarPopup({
  anchor,
  name,
  current,
  onPick,
  onClose,
}: {
  anchor: HTMLElement
  name: string
  current: string
  onPick: (avatar: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const panel = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  // Below the picture if it fits, else above; always inside the window.
  useLayoutEffect(() => {
    const place = () => {
      const el = panel.current
      if (!el) return
      const a = anchor.getBoundingClientRect()
      const { offsetWidth: w, offsetHeight: h } = el
      const left = Math.min(
        Math.max(a.left + a.width / 2 - w / 2, MARGIN),
        window.innerWidth - w - MARGIN,
      )
      const below = a.bottom + MARGIN
      const top =
        below + h <= window.innerHeight - MARGIN
          ? below
          : Math.max(a.top - h - MARGIN, MARGIN)
      setPos({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!panel.current?.contains(target) && !anchor.contains(target)) close.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      close.current()
      anchor.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchor])

  // Focus the current picture once the popup is placed (hidden elements can't take focus).
  const placed = pos !== null
  useEffect(() => {
    if (placed) panel.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
  }, [placed])

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={t('players.pickAvatar', { name })}
      className="fixed z-50 w-[17rem] max-w-[calc(100vw-1rem)] rounded-2xl border border-border bg-surface p-3 shadow-2xl shadow-black/50"
      style={pos ?? { top: 0, left: 0, visibility: 'hidden' }}
    >
      <div role="radiogroup" className="grid grid-cols-4 gap-2">
        {AVATARS.map((src, i) => (
          <button
            key={src}
            type="button"
            role="radio"
            aria-checked={src === current}
            aria-label={t('players.avatarN', { n: i + 1 })}
            onClick={() => onPick(src)}
            className={`aspect-square overflow-hidden rounded-full border-2 bg-surface-2 active:scale-95 ${
              src === current ? 'border-accent' : 'border-transparent'
            }`}
          >
            <img src={src} alt="" className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
