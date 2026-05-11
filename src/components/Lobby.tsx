import { useState } from 'react'
import { useGame } from '../game/state'
import PairPicker from './PairPicker'
import type { Difficulty } from '../game/types'

const DIFFICULTY_OPTIONS: Array<{
  value: Difficulty
  label: string
  hint: string
}> = [
  { value: 'easy', label: 'Easy', hint: "Spy's hint is loosely related — beginner friendly." },
  { value: 'hard', label: 'Hard', hint: "Spy's hint is very close to the real word — classic." },
  { value: 'none', label: 'No hint', hint: "Spy gets no word at all — pure bluffing." },
]

export default function Lobby() {
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
    while (taken.has(`Player ${n}`)) n++
    return `Player ${n}`
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
        <h2 className="font-display text-2xl font-bold">Pass-and-play</h2>
        <p className="text-slate-400 text-sm">
          Add everyone playing. Need at least 3.
        </p>
      </header>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="label">Players ({players.length})</div>
          <button
            type="button"
            onClick={() => addPlayer(nextDefaultName())}
            className="text-xs font-semibold text-accent-400 hover:text-accent-500"
          >
            + Quick add
          </button>
        </div>
        <form className="flex gap-2" onSubmit={submit}>
          <input
            className="input flex-1"
            placeholder="Name (or leave blank)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            inputMode="text"
            autoCorrect="off"
            autoCapitalize="words"
          />
          <button type="submit" className="btn-primary px-5">
            Add
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
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-sm text-slate-500 italic">No players yet.</li>
          )}
        </ul>
      </section>

      <section className="card">
        <PairPicker />
      </section>

      <section className="card space-y-3">
        <div className="label">Difficulty</div>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSettings({ difficulty: opt.value })}
              className={`px-3 py-2 rounded-full text-sm border transition ${
                settings.difficulty === opt.value
                  ? 'bg-accent-500 text-ink-900 border-accent-500'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {DIFFICULTY_OPTIONS.find((o) => o.value === settings.difficulty)?.hint}
        </p>
      </section>

      <section className="card space-y-3">
        <div className="label">Discussion timer</div>
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
              {s === 0 ? 'No timer' : `${s / 60} min`}
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
          Start round →
        </button>
        {!canStart && players.length < 3 && (
          <p className="text-center text-sm text-slate-500 mt-2">
            Add at least 3 players to start.
          </p>
        )}
        {!canStart &&
          players.length >= 3 &&
          settings.pairSource.selectedCategoryIds.length === 0 && (
            <p className="text-center text-sm text-slate-500 mt-2">
              Pick at least one word source.
            </p>
          )}
      </div>
    </div>
  )
}
