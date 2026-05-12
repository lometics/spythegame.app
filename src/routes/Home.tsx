import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGame } from '../game/state'
import PairPicker from '../components/PairPicker'
import QrScannerModal from '../components/QrScannerModal'
import { createRoom, joinRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'
import type { Difficulty } from '../game/types'
import { maxSpiesFor, clampSpyCount } from '../game/machine'

type Step =
  | 'mode'
  | 'sd_players'
  | 'sd_categories'
  | 'sd_options'
  | 'od_role'
  | 'host_name'
  | 'host_categories'
  | 'host_options'
  | 'join_code'
  | 'join_name'

const SD_FLOW: Step[] = ['mode', 'sd_players', 'sd_categories', 'sd_options']
const HOST_FLOW: Step[] = ['mode', 'od_role', 'host_name', 'host_categories', 'host_options']
const JOIN_FLOW: Step[] = ['mode', 'od_role', 'join_code', 'join_name']

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; icon: string }> = [
  { value: 'none', icon: 'ðŸ™ˆ' },
  { value: 'easy', icon: 'ðŸ˜Ž' },
  { value: 'medium', icon: 'ðŸ¤”' },
  { value: 'hard', icon: 'ðŸ¥µ' },
]

function flowFor(step: Step): Step[] {
  if (SD_FLOW.includes(step)) return SD_FLOW
  if (HOST_FLOW.includes(step)) return HOST_FLOW
  if (JOIN_FLOW.includes(step)) return JOIN_FLOW
  return SD_FLOW
}

export default function Home() {
  const { t } = useTranslation()
  const [history, setHistory] = useState<Step[]>(['mode'])
  const step = history[history.length - 1]

  const go = (next: Step) => setHistory((h) => [...h, next])
  const back = () =>
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))

  const flow = flowFor(step)
  const currentIdx = flow.indexOf(step)
  const totalSteps = flow.length

  return (
    <div className="space-y-3 sm:space-y-5 flex flex-col flex-1">
      <header className="text-center pt-2 sm:pt-6">
        <div className="inline-block text-3xl sm:text-5xl mb-1 sm:mb-2">ðŸ•µï¸</div>
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
          {t('home.title')}
        </h1>
      </header>

      {step !== 'mode' && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={back}
            className="text-slate-400 hover:text-slate-200"
          >
            {t('wizard.back')}
          </button>
          <span>
            {t('wizard.stepLabel', {
              current: currentIdx + 1,
              total: totalSteps,
            })}
          </span>
        </div>
      )}

      {step === 'mode' && <ModeStep onPick={(m) => go(m)} />}
      {step === 'sd_players' && (
        <PlayersStep onNext={() => go('sd_categories')} />
      )}
      {step === 'sd_categories' && (
        <CategoriesStep onNext={() => go('sd_options')} />
      )}
      {step === 'sd_options' && <SingleOptionsStep />}
      {step === 'od_role' && (
        <RoleStep
          onHost={() => go('host_name')}
          onJoin={() => go('join_code')}
        />
      )}
      {step === 'host_name' && (
        <HostNameStep onNext={() => go('host_categories')} />
      )}
      {step === 'host_categories' && (
        <CategoriesStep onNext={() => go('host_options')} />
      )}
      {step === 'host_options' && <HostOptionsStep />}
      {step === 'join_code' && (
        <JoinCodeStep onNext={() => go('join_name')} />
      )}
      {step === 'join_name' && <JoinNameStep />}
    </div>
  )
}

function ModeStep({ onPick }: { onPick: (next: Step) => void }) {
  const { t } = useTranslation()
  const configured = isFirebaseConfigured()
  return (
    <div className="space-y-3 flex flex-col flex-1">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-center">
        {t('wizard.modeTitle')}
      </h2>
      <div className="grid gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onPick('sd_players')}
          className="card hover:bg-ink-700/60 transition text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold">
                {t('wizard.modeSingle')}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                {t('wizard.modeSingleDesc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">ðŸ“±</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onPick('od_role')}
          disabled={!configured}
          className="card hover:bg-ink-700/60 transition text-left disabled:opacity-40"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold">
                {t('wizard.modeOnline')}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                {t('wizard.modeOnlineDesc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">ðŸŒ</div>
          </div>
        </button>
      </div>
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
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="font-display font-bold text-base sm:text-lg flex items-center gap-2">
          <span aria-hidden>📖</span>
          {t('home.howTo.title')}
        </span>
        <span
          aria-hidden
          className="text-slate-400 transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <ol className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
        {steps.map((n) => (
          <li key={n} className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-accent-500/15 text-accent-400 inline-flex items-center justify-center font-bold text-sm border border-accent-500/30">
              {n}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-slate-100">
                {t(`home.howTo.step${n}_title`)}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">
                {t(`home.howTo.step${n}`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 pt-3 sm:pt-4 border-t border-white/10">
        <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          {t('home.howTo.winTitle')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-2.5">
            <div className="text-xs sm:text-sm font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
              <span aria-hidden>✅</span>
              {t('home.howTo.civWinLabel')}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('home.howTo.civWin')}
            </p>
          </div>
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-2.5">
            <div className="text-xs sm:text-sm font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
              <span aria-hidden>🕵️</span>
              {t('home.howTo.spyWinLabel')}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('home.howTo.spyWin')}
            </p>
          </div>
        </div>
      </div>
    </details>
  )
}
function RoleStep({
  onHost,
  onJoin,
}: {
  onHost: () => void
  onJoin: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 flex flex-col flex-1">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-center">
        {t('wizard.roleTitle')}
      </h2>
      <div className="grid gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onHost}
          className="card hover:bg-ink-700/60 transition text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold">
                {t('wizard.roleHost')}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                {t('wizard.roleHostDesc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">ðŸŽ™ï¸</div>
          </div>
        </button>
        <button
          type="button"
          onClick={onJoin}
          className="card hover:bg-ink-700/60 transition text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold">
                {t('wizard.roleJoin')}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                {t('wizard.roleJoinDesc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">ðŸ”‘</div>
          </div>
        </button>
      </div>
    </div>
  )
}

function PlayersStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const players = useGame((s) => s.players)
  const addPlayer = useGame((s) => s.addPlayer)
  const removePlayer = useGame((s) => s.removePlayer)
  const cycleAvatar = useGame((s) => s.cycleAvatar)
  const [name, setName] = useState('')

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

  const canNext = players.length >= 3

  return (
    <div className="space-y-3 flex flex-col flex-1">
      <header>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('wizard.playersTitle')}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          {t('wizard.playersDesc')}
        </p>
      </header>

      <section className="card space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="label">
            {t('lobby.playersLabel', { count: players.length })}
          </div>
          <button
            type="button"
            onClick={() => addPlayer(nextDefaultName())}
            className="text-xs font-semibold text-accent-400 hover:text-accent-500"
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
              className="flex items-center justify-between bg-ink-700/40 rounded-lg px-2 py-1.5"
            >
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cycleAvatar(p.id)}
                  className="w-8 h-8 rounded-full bg-ink-700 overflow-hidden border border-white/10 hover:border-accent-400/60 active:scale-95 transition shrink-0"
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </button>
                <span className="font-medium text-sm">{p.name}</span>
              </span>
              <button
                onClick={() => removePlayer(p.id)}
                className="text-slate-400 hover:text-rose-400 w-7 h-7 inline-flex items-center justify-center rounded-lg"
                aria-label={t('lobby.removeAria', { name: p.name })}
              >
                âœ•
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-xs text-slate-500 italic">
              {t('lobby.empty')}
            </li>
          )}
        </ul>
      </section>

      <div className="action-bar">
        <button
          onClick={onNext}
          disabled={!canNext}
          className="btn-primary w-full py-3 sm:py-4"
        >
          {t('wizard.next')}
        </button>
        {!canNext && (
          <p className="text-center text-xs text-slate-500 mt-1.5">
            {t('lobby.needPlayers')}
          </p>
        )}
      </div>
    </div>
  )
}

function CategoriesStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const selected = useGame((s) => s.settings.pairSource.selectedCategoryIds)
  const canNext = selected.length > 0
  return (
    <div className="space-y-3 flex flex-col flex-1">
      <header>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('wizard.categoriesTitle')}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          {t('wizard.categoriesDesc')}
        </p>
      </header>
      <section className="card">
        <PairPicker />
      </section>
      <div className="action-bar">
        <button
          onClick={onNext}
          disabled={!canNext}
          className="btn-primary w-full py-3 sm:py-4"
        >
          {t('wizard.next')}
        </button>
        {!canNext && (
          <p className="text-center text-xs text-slate-500 mt-1.5">
            {t('lobby.needSource')}
          </p>
        )}
      </div>
    </div>
  )
}

function OptionsPanel({ playerCount }: { playerCount?: number }) {
  const { t } = useTranslation()
  const settings = useGame((s) => s.settings)
  const setSettings = useGame((s) => s.setSettings)
  const maxSpies = playerCount !== undefined ? maxSpiesFor(playerCount) : 99
  const spyOptions = Array.from(
    { length: Math.min(maxSpies, 5) },
    (_, i) => i + 1,
  )
  const currentSpyCount = clampSpyCount(
    settings.spyCount,
    playerCount ?? settings.spyCount + 2,
  )
  return (
    <>
      <section className="card space-y-2">
        <div className="label">{t('lobby.spyCountLabel')}</div>
        <div className="flex gap-1.5 flex-wrap">
          {spyOptions.map((n) => (
            <button
              key={n}
              onClick={() => setSettings({ spyCount: n })}
              className={`px-2.5 py-1.5 rounded-full text-xs sm:text-sm border transition ${
                currentSpyCount === n
                  ? 'bg-accent-500 text-ink-900 border-accent-500'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500">
          {t('lobby.spyCountHint')}
        </p>
      </section>
      <section className="card">
        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="min-w-0">
            <span className="label block">{t('lobby.spiesKnowLabel')}</span>
            <span className="block text-[11px] sm:text-xs text-slate-500">
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
            disabled={currentSpyCount < 2}
          />
        </label>
      </section>
      <section className="card space-y-2">
        <div className="label">{t('lobby.difficultyLabel')}</div>
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSettings({ difficulty: opt.value })}
              className={`px-2.5 py-1.5 rounded-full text-xs sm:text-sm border transition inline-flex items-center gap-1 ${
                settings.difficulty === opt.value
                  ? 'bg-accent-500 text-ink-900 border-accent-500'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
            >
              <span aria-hidden>{opt.icon}</span>
              <span>{t(`lobby.difficulty.${opt.value}.label`)}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500">
          {t(`lobby.difficulty.${settings.difficulty}.hint`)}
        </p>
      </section>
      <section className="card space-y-2">
        <div className="label">{t('lobby.timerLabel')}</div>
        <div className="flex gap-1.5 flex-wrap">
          {[0, 60, 120, 180, 300].map((s) => (
            <button
              key={s}
              onClick={() => setSettings({ timerSeconds: s })}
              className={`px-2.5 py-1.5 rounded-full text-xs sm:text-sm border transition ${
                settings.timerSeconds === s
                  ? 'bg-accent-500 text-ink-900 border-accent-500'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
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

function SingleOptionsStep() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startRound = useGame((s) => s.startRound)
  const playerCount = useGame((s) => s.players.length)
  return (
    <div className="space-y-3 flex flex-col flex-1">
      <header>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('wizard.optionsTitle')}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          {t('wizard.optionsDesc')}
        </p>
      </header>
      <OptionsPanel playerCount={playerCount} />
      <div className="action-bar">
        <button
          onClick={() => {
            startRound()
            navigate('/local')
          }}
          className="btn-primary w-full text-base sm:text-lg py-3 sm:py-4"
        >
          {t('wizard.startBtn')}
        </button>
      </div>
    </div>
  )
}

function HostNameStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  return (
    <div className="space-y-3 flex flex-col flex-1">
      <header>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('wizard.hostNameTitle')}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          {t('wizard.hostNameDesc')}
        </p>
      </header>
      <section className="card space-y-2">
        <label className="label">{t('online.yourName')}</label>
        <input
          className="input"
          value={onlineName}
          maxLength={20}
          placeholder={t('online.hostNamePlaceholder')}
          onChange={(e) => setOnlineName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onlineName.trim() && onNext()}
          autoCapitalize="words"
          autoFocus
        />
      </section>
      <div className="action-bar">
        <button
          onClick={onNext}
          disabled={!onlineName.trim()}
          className="btn-primary w-full py-3 sm:py-4"
        >
          {t('wizard.next')}
        </button>
      </div>
    </div>
  )
}

function HostOptionsStep() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const onlineName = useGame((s) => s.onlineName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCreate = async () => {
    setBusy(true)
    setError(null)
    try {
      const code = await createRoom(onlineName)
      navigate(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errCreateRoom'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 flex flex-col flex-1">
      <header>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('wizard.optionsTitle')}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          {t('wizard.optionsDesc')}
        </p>
      </header>
      <OptionsPanel />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="action-bar">
        <button
          onClick={onCreate}
          disabled={busy}
          className="btn-primary w-full text-base sm:text-lg py-3 sm:py-4"
        >
          {busy ? t('wizard.creating') : t('wizard.hostCreateBtn')}
        </button>
      </div>
    </div>
  )
}

function extractCode(scanned: string): string | null {
  const trimmed = scanned.trim()
  const m = trimmed.match(/\/join\/([A-Za-z0-9]{4})/)
  if (m) return m[1].toUpperCase()
  if (/^[A-Za-z0-9]{4}$/.test(trimmed)) return trimmed.toUpperCase()
  return null
}

function JoinCodeStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const joinCode = useGame((s) => s.joinCode)
  const setJoinCode = useGame((s) => s.setJoinCode)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const canNext = joinCode.trim().length === 4

  const onScan = (text: string) => {
    const code = extractCode(text)
    if (!code) {
      setScanError(t('online.qrInvalid'))
      setScannerOpen(false)
      return
    }
    setJoinCode(code)
    setScanError(null)
    setScannerOpen(false)
  }

  return (
    <div className="space-y-3 flex flex-col flex-1">
      <header>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('wizard.joinCodeTitle')}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          {t('wizard.joinCodeDesc')}
        </p>
      </header>
      <section className="card space-y-2">
        <div className="flex items-center justify-between">
          <label className="label">{t('online.roomCode')}</label>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() => {
              setScanError(null)
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
          autoFocus
        />
        {scanError && <p className="text-sm text-rose-400">{scanError}</p>}
      </section>
      <div className="action-bar">
        <button
          onClick={onNext}
          disabled={!canNext}
          className="btn-primary w-full py-3 sm:py-4"
        >
          {t('wizard.next')}
        </button>
      </div>
      <QrScannerModal
        open={scannerOpen}
        onResult={onScan}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  )
}

function JoinNameStep() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const joinCode = useGame((s) => s.joinCode)
  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onJoin = async () => {
    if (!onlineName.trim() || !joinCode.trim()) {
      setError(t('online.errNeedBoth'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await joinRoom(joinCode.trim().toUpperCase(), onlineName)
      navigate(`/room/${joinCode.trim().toUpperCase()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errCouldNotJoin'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 flex flex-col flex-1">
      <header>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('wizard.joinNameTitle')}
        </h2>
      </header>
      <section className="card space-y-2">
        <label className="label">{t('online.yourName')}</label>
        <input
          className="input"
          value={onlineName}
          maxLength={20}
          placeholder={t('online.joinNamePlaceholder')}
          onChange={(e) => setOnlineName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onJoin()}
          autoCapitalize="words"
          autoFocus
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </section>
      <div className="action-bar">
        <button
          onClick={onJoin}
          disabled={busy || !onlineName.trim()}
          className="btn-primary w-full py-3 sm:py-4"
        >
          {busy ? t('wizard.joining') : t('wizard.joinBtn')}
        </button>
      </div>
    </div>
  )
}
