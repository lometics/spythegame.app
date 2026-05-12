import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronDown, Settings, X } from 'lucide-react'
import { useGame } from '../game/state'
import PairPicker from '../components/PairPicker'
import QrScannerModal from '../components/QrScannerModal'
import { createRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'
import type { Difficulty } from '../game/types'
import { maxSpiesFor, clampSpyCount, isSpyCountRange } from '../game/machine'

type View = 'home' | 'single'

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; icon: string }> = [
  { value: 'easy', icon: '🙈' },
  { value: 'medium', icon: '🤔' },
  { value: 'hard', icon: '🥵' },
]

export default function Home({
  initialView,
}: { initialView?: View } = {}) {
  const { t } = useTranslation()
  const [view, setView] = useState<View>(initialView ?? 'home')
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <div className="space-y-4 flex flex-col flex-1">
      <header className="relative text-center pt-2 sm:pt-6">
        <div className="inline-block text-3xl sm:text-4xl mb-2">🕵️</div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
          {t('home.title')}
        </h1>
        {view === 'home' && (
          <Link
            to="/options"
            aria-label={t('options.title')}
            title={t('options.title')}
            className="btn-icon absolute right-0 top-1 sm:top-4"
          >
            <Settings size={20} />
          </Link>
        )}
      </header>

      {view === 'home' && (
        <>
          <YourNameField />
          <ModeView
            onSingle={() => setView('single')}
            onJoin={() => setJoinOpen(true)}
          />
        </>
      )}
      {view === 'single' && <SingleDeviceConfig onBack={() => setView('home')} />}

      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}

function YourNameField() {
  const { t } = useTranslation()
  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const [editing, setEditing] = useState(!onlineName.trim())
  const [draft, setDraft] = useState(onlineName)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) setOnlineName(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <section className="card space-y-2">
        <label className="label">{t('online.yourName')}</label>
        <div className="flex gap-2">
          <input
            autoFocus
            className="input flex-1"
            value={draft}
            maxLength={20}
            placeholder={t('online.hostNamePlaceholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
            }}
            autoCapitalize="words"
          />
          <button
            type="button"
            onClick={commit}
            disabled={!draft.trim()}
            className="btn-primary px-4 disabled:opacity-40"
          >
            {t('common.save')}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="card flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="label">{t('online.yourName')}</div>
        <div className="font-semibold text-sm truncate">{onlineName}</div>
      </div>
      <button
        type="button"
        onClick={() => {
          setDraft(onlineName)
          setEditing(true)
        }}
        className="text-sm font-medium text-accent-400 hover:text-accent-300 min-h-11 px-2"
      >
        {t('home.changeName')}
      </button>
    </section>
  )
}

function ModeView({
  onSingle,
  onJoin,
}: {
  onSingle: () => void
  onJoin: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const configured = isFirebaseConfigured()
  const onlineName = useGame((s) => s.onlineName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasName = onlineName.trim().length > 0

  const onOnline = async () => {
    if (!hasName) return
    setBusy(true)
    setError(null)
    try {
      const code = await createRoom(onlineName.trim())
      navigate(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errCreateRoom'))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 flex flex-col flex-1">
      <h2 className="font-display text-xl font-semibold text-center text-foreground/85">
        {t('wizard.modeTitle')}
      </h2>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={onSingle}
          className="card hover:bg-ink-700/60 transition text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">
                {t('wizard.modeSingle')}
              </div>
              <div className="text-sm text-foreground/60">
                {t('wizard.modeSingleDesc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">📱</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOnline}
          disabled={!configured || busy || !hasName}
          className="card hover:bg-ink-700/60 transition text-left disabled:opacity-40"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">
                {t('home.createRoom')}
              </div>
              <div className="text-sm text-foreground/60">
                {busy ? t('wizard.creating') : t('home.createRoomDesc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">🌐</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onJoin}
          disabled={!configured || !hasName}
          className="card hover:bg-ink-700/60 transition text-left disabled:opacity-40"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">
                {t('home.joinRoom')}
              </div>
              <div className="text-sm text-foreground/60">
                {t('home.joinRoomDesc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">🔑</div>
          </div>
        </button>
      </div>
      {!hasName && configured && (
        <p className="text-xs text-foreground/50 text-center">
          {t('home.setNameFirst')}
        </p>
      )}

      {error && <p className="text-sm text-rose-400 text-center">{error}</p>}
      {!configured && (
        <p className="text-xs text-amber-400 text-center">
          {t('online.fbWarnTitleShort')}
        </p>
      )}
      <HowToPlay />
    </div>
  )
}

function HowToPlay() {
  const { t } = useTranslation()
  const steps = [1, 2, 3, 4] as const
  return (
    <details className="card group">
      <summary className="flex items-center justify-between cursor-pointer list-none min-h-11">
        <span className="font-display font-semibold text-base flex items-center gap-2">
          <span aria-hidden>📖</span>
          {t('home.howTo.title')}
        </span>
        <ChevronDown
          size={18}
          className="text-foreground/60 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ol className="mt-4 space-y-3">
        {steps.map((n) => (
          <li key={n} className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-accent-500/15 text-accent-400 inline-flex items-center justify-center font-bold text-sm border border-accent-500/30">
              {n}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-sm">
                {t(`home.howTo.step${n}_title`)}
              </div>
              <p className="text-sm text-foreground/60 mt-0.5 leading-relaxed">
                {t(`home.howTo.step${n}`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="label-tiny mb-2">{t('home.howTo.winTitle')}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3 flex flex-col">
            <div className="text-sm font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
              <span aria-hidden>✅</span>
              {t('home.howTo.civWinLabel')}
            </div>
            <p className="text-xs text-foreground/75 leading-relaxed">
              {t('home.howTo.civWin')}
            </p>
          </div>
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-3 flex flex-col">
            <div className="text-sm font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
              <span aria-hidden>🕵️</span>
              {t('home.howTo.spyWinLabel')}
            </div>
            <p className="text-xs text-foreground/75 leading-relaxed">
              {t('home.howTo.spyWin')}
            </p>
          </div>
        </div>
      </div>
    </details>
  )
}

function SingleDeviceConfig({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startRound = useGame((s) => s.startRound)
  const players = useGame((s) => s.players)
  const addPlayer = useGame((s) => s.addPlayer)
  const removePlayer = useGame((s) => s.removePlayer)
  const renamePlayer = useGame((s) => s.renamePlayer)
  const cycleAvatar = useGame((s) => s.cycleAvatar)
  const selected = useGame((s) => s.settings.pairSource.selectedCategoryIds)

  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const startEdit = (id: string, current: string) => {
    setEditingId(id)
    setEditDraft(current)
  }
  const commitEdit = () => {
    if (editingId) {
      const trimmed = editDraft.trim()
      if (trimmed) renamePlayer(editingId, trimmed)
    }
    setEditingId(null)
    setEditDraft('')
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const nextDefaultName = () => {
    let n = players.length + 1
    const taken = new Set(players.map((p) => p.name))
    while (taken.has(t('lobby.defaultName', { n }))) n++
    return t('lobby.defaultName', { n })
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    addPlayer(name.trim() || nextDefaultName())
    setName('')
  }

  const canStart = players.length >= 3 && selected.length > 0

  return (
    <div className="space-y-3 flex flex-col flex-1">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md"
        >
          <ArrowLeft size={16} />
          {t('wizard.back')}
        </button>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="label">
            {t('lobby.playersLabel', { count: players.length })}
          </div>
          <button
            type="button"
            onClick={() => addPlayer(nextDefaultName())}
            className="text-sm font-semibold text-accent-400 hover:text-accent-500 min-h-11 px-2"
          >
            {t('lobby.quickAdd')}
          </button>
        </div>
        <form className="flex gap-2" onSubmit={submit}>
          <input
            className="input flex-1"
            placeholder={t('lobby.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoCapitalize="words"
          />
          <button type="submit" className="btn-primary px-4">
            {t('lobby.addBtn')}
          </button>
        </form>
        <ul className="space-y-1.5">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 surface-muted rounded-lg pl-2 pr-1 py-1.5 min-h-12"
            >
              <span className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => cycleAvatar(p.id)}
                  className="w-9 h-9 rounded-full bg-ink-700 overflow-hidden border border-white/10 hover:border-accent-400/60 active:scale-95 transition shrink-0"
                  aria-label="Change avatar"
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </button>
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitEdit()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelEdit()
                      }
                    }}
                    maxLength={20}
                    autoCapitalize="words"
                    className="font-medium text-sm bg-ink-900/60 border border-accent-500/60 rounded px-2 py-1 min-w-0 flex-1 focus:outline-none focus:border-accent-400"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(p.id, p.name)}
                    className="font-medium text-sm text-left truncate hover:text-accent-400 transition min-w-0 flex-1 py-2"
                    aria-label={t('lobby.renameAria', {
                      name: p.name,
                      defaultValue: `Rename ${p.name}`,
                    })}
                  >
                    {p.name}
                  </button>
                )}
              </span>
              <button
                onClick={() => removePlayer(p.id)}
                className="btn-icon w-9 h-9 hover:text-rose-400 shrink-0"
                aria-label={t('lobby.removeAria', { name: p.name })}
              >
                <X size={16} />
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-sm text-foreground/50 italic">
              {t('lobby.empty')}
            </li>
          )}
        </ul>
      </section>

      <section className="card">
        <PairPicker />
      </section>

      <OptionsPanel playerCount={players.length} />

      <div className="action-bar">
        <button
          onClick={() => {
            startRound()
            navigate('/local')
          }}
          disabled={!canStart}
          className="btn-primary w-full text-base py-3.5"
        >
          {t('wizard.startBtn')}
        </button>
        {players.length < 3 && (
          <p className="text-center text-xs text-foreground/50 mt-1.5">
            {t('lobby.needPlayers')}
          </p>
        )}
        {players.length >= 3 && selected.length === 0 && (
          <p className="text-center text-xs text-foreground/50 mt-1.5">
            {t('lobby.needSource')}
          </p>
        )}
      </div>
    </div>
  )
}

export function OptionsPanel({ playerCount }: { playerCount?: number }) {
  const { t } = useTranslation()
  const settings = useGame((s) => s.settings)
  const setSettings = useGame((s) => s.setSettings)
  const maxSpies = playerCount !== undefined ? maxSpiesFor(playerCount) : 99
  const spyOptions = Array.from(
    { length: Math.min(maxSpies, 5) },
    (_, i) => i + 1,
  )
  const isRange = isSpyCountRange(settings.spyCount)
  const isRandom = isRange
  const rangeCap = Math.min(maxSpies, 5)
  const rangeOptions = Array.from({ length: rangeCap }, (_, i) => i + 1)
  const currentRange = isRange
    ? {
        min: Math.max(1, Math.min((settings.spyCount as { min: number }).min, rangeCap)),
        max: Math.max(1, Math.min((settings.spyCount as { max: number }).max, rangeCap)),
      }
    : null
  const currentSpyCount = isRandom
    ? null
    : clampSpyCount(
        settings.spyCount as number,
        playerCount ?? (settings.spyCount as number) + 2,
      )
  const showRandom = maxSpies >= 2
  const knowDisabled = isRandom
    ? (currentRange?.max ?? 1) < 2
    : (currentSpyCount ?? 1) < 2
  const pickRandom = () => {
    if (isRange) return
    setSettings({ spyCount: { min: 1, max: rangeCap } })
  }
  const setRangeMin = (n: number) => {
    const max = Math.max(n, currentRange?.max ?? n)
    setSettings({ spyCount: { min: n, max } })
  }
  const setRangeMax = (n: number) => {
    const min = Math.min(n, currentRange?.min ?? n)
    setSettings({ spyCount: { min, max: n } })
  }
  return (
    <>
      <section className="card space-y-3">
        <div className="label">{t('lobby.spyCountLabel')}</div>
        <div className="flex gap-1.5 flex-wrap">
          {spyOptions.map((n) => (
            <button
              key={n}
              onClick={() => setSettings({ spyCount: n })}
              className={`pill ${currentSpyCount === n ? 'pill-selected' : ''}`}
            >
              {n}
            </button>
          ))}
          {showRandom && (
            <button
              onClick={pickRandom}
              className={`pill ${isRandom ? 'pill-selected' : ''}`}
            >
              <span aria-hidden>🎲</span>
              <span>{t('lobby.spyCountRandom')}</span>
            </button>
          )}
        </div>
        {isRandom && currentRange && (
          <div className="space-y-2 pt-1">
            <div>
              <div className="label-tiny">
                {t('lobby.spyCountFromLabel', { defaultValue: 'From' })}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {rangeOptions.map((n) => (
                  <button
                    key={`min-${n}`}
                    onClick={() => setRangeMin(n)}
                    className={`pill ${currentRange.min === n ? 'pill-selected' : ''}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="label-tiny">
                {t('lobby.spyCountToLabel', { defaultValue: 'To' })}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {rangeOptions.map((n) => {
                  const disabled = n < currentRange.min
                  return (
                    <button
                      key={`max-${n}`}
                      onClick={() => setRangeMax(n)}
                      disabled={disabled}
                      className={`pill ${currentRange.max === n ? 'pill-selected' : ''}`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        <p className="text-xs text-foreground/50">
          {isRandom && currentRange
            ? currentRange.min === currentRange.max
              ? t('lobby.spyCountRandomFixedHint', {
                  n: currentRange.min,
                  defaultValue: `Always ${currentRange.min} spies.`,
                })
              : t('lobby.spyCountRandomRangeHint', {
                  min: currentRange.min,
                  max: currentRange.max,
                  defaultValue: `Picks ${currentRange.min}–${currentRange.max} spies each round.`,
                })
            : t('lobby.spyCountHint')}
        </p>
      </section>
      <section className="card">
        <label className="flex items-center justify-between gap-3 cursor-pointer min-h-11 py-1">
          <span className="min-w-0">
            <span className="label block">{t('lobby.spiesKnowLabel')}</span>
            <span className="block text-xs text-foreground/50 mt-0.5">
              {t('lobby.spiesKnowHint')}
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.spiesKnowEachOther}
            onChange={(e) =>
              setSettings({ spiesKnowEachOther: e.target.checked })
            }
            className="h-5 w-5 accent-accent-500 shrink-0"
            disabled={knowDisabled}
          />
        </label>
      </section>
      <section className="card space-y-3">
        <div className="label">{t('lobby.difficultyLabel')}</div>
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSettings({ difficulty: opt.value })}
              className={`pill ${settings.difficulty === opt.value ? 'pill-selected' : ''}`}
            >
              <span aria-hidden>{opt.icon}</span>
              <span>{t(`lobby.difficulty.${opt.value}.label`)}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/50">
          {t(`lobby.difficulty.${settings.difficulty}.hint`)}
        </p>
      </section>
      <section className="card space-y-3">
        <div className="label">{t('lobby.timerLabel')}</div>
        <div className="flex gap-1.5 flex-wrap">
          {[0, 60, 120, 180, 300, 600].map((s) => (
            <button
              key={s}
              onClick={() => setSettings({ timerSeconds: s })}
              className={`pill ${settings.timerSeconds === s ? 'pill-selected' : ''}`}
            >
              {s === 0
                ? t('lobby.timerOff')
                : t('lobby.timerMin', { count: s / 60 })}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function extractCode(scanned: string): string | null {
  const trimmed = scanned.trim()
  const m = trimmed.match(/\/(?:join|room)\/([A-Za-z0-9]{4})/)
  if (m) return m[1].toUpperCase()
  if (/^[A-Za-z0-9]{4}$/.test(trimmed)) return trimmed.toUpperCase()
  return null
}

export function JoinRoomModal({
  open,
  onClose,
  title,
}: {
  open: boolean
  onClose: () => void
  title?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const joinCode = useGame((s) => s.joinCode)
  const setJoinCode = useGame((s) => s.setJoinCode)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const canJoin = joinCode.trim().length === 4

  const onScan = (text: string) => {
    const code = extractCode(text)
    if (!code) {
      setError(t('online.qrInvalid'))
      setScannerOpen(false)
      return
    }
    setJoinCode(code)
    setError(null)
    setScannerOpen(false)
  }

  const submit = () => {
    if (!canJoin) return
    const trimmedName = onlineName.trim()
    if (trimmedName) setOnlineName(trimmedName)
    setError(null)
    const code = joinCode.trim().toUpperCase()
    onClose()
    navigate(`/room/${code}`)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md sm:rounded-2xl rounded-t-2xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">
            {title ?? t('home.joinExisting')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon -mr-2"
            aria-label={t('common.dismiss')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-2">
          <label className="label">{t('online.yourName')}</label>
          <input
            className="input"
            value={onlineName}
            maxLength={20}
            placeholder={t('online.joinNamePlaceholder')}
            onChange={(e) => setOnlineName(e.target.value)}
            autoCapitalize="words"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label">{t('online.roomCode')}</label>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => {
                setError(null)
                setScannerOpen(true)
              }}
            >
              {t('online.scanQr')}
            </button>
          </div>
          <input
            className="input font-mono uppercase tracking-widest text-center text-xl"
            value={joinCode}
            maxLength={4}
            placeholder={t('online.codePlaceholder')}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          onClick={submit}
          disabled={!canJoin}
          className="btn-primary w-full py-3"
        >
          {t('wizard.joinBtn')}
        </button>
        <QrScannerModal
          open={scannerOpen}
          onResult={onScan}
          onClose={() => setScannerOpen(false)}
        />
      </div>
    </div>
  )
}
