import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../game/state'
import PairPicker from './PairPicker'
import type { Difficulty } from '../game/types'

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; icon: string }> = [
  { value: 'none', icon: '🙈' },
  { value: 'easy', icon: '😎' },
  { value: 'medium', icon: '🤔' },
  { value: 'hard', icon: '🥵' },
]

export default function Lobby() {
  const { t } = useTranslation()
  const players = useGame((s) => s.players)
  const settings = useGame((s) => s.settings)
  const addPlayer = useGame((s) => s.addPlayer)
  const removePlayer = useGame((s) => s.removePlayer)
  const setSettings = useGame((s) => s.setSettings)
  const startRound = useGame((s) => s.startRound)

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

  const canStart =
    players.length >= 3 &&
    settings.pairSource.selectedCategoryIds.length > 0

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-2xl font-bold">{t('lobby.title')}</h2>
        <p className="text-slate-400 text-sm">{t('lobby.subtitle')}</p>
      </header>

      <section className="card space-y-3">
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
            inputMode="text"
            autoCorrect="off"
            autoCapitalize="words"
          />
          <button type="submit" className="btn-primary px-5">
            {t('lobby.addBtn')}
          </button>
        </form>
        <ul className="space-y-2">
          {players.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between bg-ink-700/40 rounded-xl px-3 py-3"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-ink-700 text-xs text-slate-400 font-semibold">
                  {i + 1}
                </span>
                <span className="font-medium">{p.name}</span>
              </span>
              <button
                onClick={() => removePlayer(p.id)}
                className="text-slate-400 hover:text-rose-400 active:text-rose-300 w-8 h-8 inline-flex items-center justify-center rounded-lg"
                aria-label={t('lobby.removeAria', { name: p.name })}
              >
                ✕
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-sm text-slate-500 italic">{t('lobby.empty')}</li>
          )}
        </ul>
      </section>

      <section className="card">
        <PairPicker />
      </section>

      <section className="card space-y-3">
        <div className="label">{t('lobby.difficultyLabel')}</div>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSettings({ difficulty: opt.value })}
              className={`px-3 py-2 rounded-full text-sm border transition inline-flex items-center gap-1.5 ${
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
        <p className="text-xs text-slate-500">
          {t(`lobby.difficulty.${settings.difficulty}.hint`)}
        </p>
      </section>

      <section className="card space-y-3">
        <div className="label">{t('lobby.timerLabel')}</div>
        <div className="flex gap-2 flex-wrap">
          {[0, 60, 120, 180, 300].map((s) => (
            <button
              key={s}
              onClick={() => setSettings({ timerSeconds: s })}
              className={`px-3 py-2 rounded-full text-sm border transition ${
                settings.timerSeconds === s
                  ? 'bg-accent-500 text-ink-900 border-accent-500'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
            >
              {s === 0 ? t('lobby.timerOff') : t('lobby.timerMin', { count: s / 60 })}
            </button>
          ))}
        </div>
      </section>

      <div className="safe-bottom">
        <button
          onClick={startRound}
          disabled={!canStart}
          className="btn-primary w-full text-lg py-4"
        >
          {t('lobby.startBtn')}
        </button>
        {!canStart && players.length < 3 && (
          <p className="text-center text-sm text-slate-500 mt-2">
            {t('lobby.needPlayers')}
          </p>
        )}
        {!canStart &&
          players.length >= 3 &&
          settings.pairSource.selectedCategoryIds.length === 0 && (
            <p className="text-center text-sm text-slate-500 mt-2">
              {t('lobby.needSource')}
            </p>
          )}
      </div>
    </div>
  )
}
