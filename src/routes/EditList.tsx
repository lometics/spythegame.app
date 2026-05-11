import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../game/state'
import type { CustomList } from '../game/types'

type DraftPair = { civilian: string; spy: string }

const SUGGESTED_ICONS = ['🎴', '🎲', '🎯', '🧩', '🍀', '🔥', '💎', '🌟', '⚡', '🎨']

export default function EditList() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const customLists = useGame((s) => s.customLists)
  const upsert = useGame((s) => s.upsertCustomList)
  const deleteList = useGame((s) => s.deleteCustomList)

  const existing = useMemo<CustomList | null>(
    () => (id ? customLists.find((l) => l.id === id) ?? null : null),
    [id, customLists],
  )

  if (id && !existing) {
    return (
      <div className="space-y-4">
        <nav className="text-sm">
          <Link to="/local" className="text-slate-400 hover:text-slate-200">
            ← Back
          </Link>
        </nav>
        <div className="card">
          <div className="font-semibold">List not found</div>
          <div className="text-sm text-slate-400 mt-1">
            This word list no longer exists.
          </div>
        </div>
      </div>
    )
  }

  const [name, setName] = useState(existing?.name ?? '')
  const [icon, setIcon] = useState(existing?.icon ?? '🎴')
  const [pairs, setPairs] = useState<DraftPair[]>(
    existing?.pairs?.length
      ? existing.pairs.map((p) => ({ civilian: p.civilian, spy: p.spy }))
      : [{ civilian: '', spy: '' }],
  )

  const updatePair = (i: number, patch: Partial<DraftPair>) => {
    setPairs((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  }
  const addPair = () =>
    setPairs((ps) => [...ps, { civilian: '', spy: '' }])
  const removePair = (i: number) =>
    setPairs((ps) =>
      ps.length <= 1 ? [{ civilian: '', spy: '' }] : ps.filter((_, j) => j !== i),
    )

  const trimmedName = name.trim()
  const validPairs = pairs.filter((p) => p.civilian.trim() && p.spy.trim())
  const canSave = trimmedName.length > 0 && validPairs.length > 0

  const goBack = () => navigate('/local')

  const save = () => {
    if (!canSave) return
    const next: CustomList = {
      id: existing?.id ?? crypto.randomUUID(),
      name: trimmedName,
      icon: icon.trim() || '🎴',
      pairs: validPairs.map((p) => ({
        civilian: p.civilian.trim(),
        spy: p.spy.trim(),
      })),
      createdAt: existing?.createdAt ?? Date.now(),
    }
    upsert(next)
    goBack()
  }

  const remove = () => {
    if (!existing) return
    deleteList(existing.id)
    goBack()
  }

  return (
    <div className="space-y-4">
      <nav className="flex items-center justify-between text-sm">
        <Link to="/local" className="text-slate-400 hover:text-slate-200">
          ← Back
        </Link>
        <span className="text-slate-500">
          {existing ? 'Edit list' : 'New list'}
        </span>
      </nav>

      <header className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {existing ? 'Edit word list' : 'New word list'}
        </h1>
        <p className="text-slate-400 text-sm">
          Add your own civilian / spy pairs. The spy's hint should be{' '}
          <span className="text-slate-200">similar</span> — not identical, not
          totally unrelated.
        </p>
      </header>

      <section className="card space-y-4">
        <div>
          <label className="label">List name</label>
          <input
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Inside jokes, Office snacks…"
            maxLength={28}
            autoFocus={!existing}
          />
        </div>

        <div>
          <label className="label">Icon</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              className="input w-20 text-2xl text-center"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
            />
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_ICONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`w-9 h-9 rounded-lg text-lg transition ${
                    icon === e
                      ? 'bg-accent-500/30 ring-1 ring-accent-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <label className="label">Pairs</label>
          <span className="text-xs text-slate-500">
            Civilian word → Spy hint
          </span>
        </div>

        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div
              key={i}
              className="flex gap-2 items-center bg-ink-700/40 rounded-xl p-2"
            >
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  className="input"
                  value={p.civilian}
                  onChange={(e) => updatePair(i, { civilian: e.target.value })}
                  placeholder="Civilians' word"
                  maxLength={30}
                />
                <input
                  className="input"
                  value={p.spy}
                  onChange={(e) => updatePair(i, { spy: e.target.value })}
                  placeholder="Spy's hint"
                  maxLength={30}
                />
              </div>
              <button
                type="button"
                onClick={() => removePair(i)}
                className="text-slate-400 hover:text-rose-400 w-8 h-8 rounded-lg"
                aria-label="Remove pair"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addPair}
          className="w-full text-sm py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/15"
        >
          + Add pair
        </button>
      </section>

      <footer className="flex items-center justify-between gap-2 safe-bottom">
        {existing ? (
          <button onClick={remove} className="btn-danger px-4 py-2 text-sm">
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="btn-ghost px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className="btn-primary px-4 py-2 text-sm"
          >
            {existing ? 'Save' : 'Create list'}
          </button>
        </div>
      </footer>
    </div>
  )
}
