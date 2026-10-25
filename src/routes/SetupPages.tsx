import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, GripVertical, Pencil, Plus, X } from 'lucide-react'
import Screen from '../components/Screen'
import { useGame } from '../game/state'
import { hintExample, listCategories } from '../game/pairs'
import { iconFor } from '../game/icons'
import { availableSpyCounts, maxSpiesFor, toggleSpyCount } from '../game/machine'
import { DIFFICULTIES } from '../game/types'
import { useSettingsEditor } from '../online/settingsEditor'

function DoneFooter() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <button type="button" className="btn-primary w-full" onClick={() => navigate(-1)}>
      {t('common.done')}
    </button>
  )
}

/* ------------------------------------------------------------------ players */

export function PlayersPage() {
  const { t } = useTranslation()
  const players = useGame((s) => s.players)
  const addPlayer = useGame((s) => s.addPlayer)
  const removePlayer = useGame((s) => s.removePlayer)
  const renamePlayer = useGame((s) => s.renamePlayer)
  const cycleAvatar = useGame((s) => s.cycleAvatar)
  const movePlayer = useGame((s) => s.movePlayer)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Drag to reorder: the row swaps places as soon as the finger passes half a
  // row, and the start point shifts with it so the row stays under the finger.
  const drag = useRef<{ id: string; startY: number; rowH: number } | null>(null)
  const [dragging, setDragging] = useState<{ id: string; dy: number } | null>(null)

  const onGripDown = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
    const row = e.currentTarget.closest('[data-player-row]') as HTMLElement | null
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id, startY: e.clientY, rowH: row?.offsetHeight || 60 }
    setDragging({ id, dy: 0 })
    navigator.vibrate?.(10)
  }
  const onGripMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const list = useGame.getState().players
    const from = list.findIndex((p) => p.id === d.id)
    const steps = Math.round((e.clientY - d.startY) / d.rowH)
    const to = Math.max(0, Math.min(list.length - 1, from + steps))
    if (to !== from) {
      movePlayer(from, to)
      d.startY += (to - from) * d.rowH
    }
    setDragging({ id: d.id, dy: e.clientY - d.startY })
  }
  const onGripUp = () => {
    drag.current = null
    setDragging(null)
  }

  const nextDefaultName = () => {
    const taken = new Set(players.map((p) => p.name))
    let n = players.length + 1
    while (taken.has(t('players.defaultName', { n }))) n++
    return t('players.defaultName', { n })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addPlayer(name.trim() || nextDefaultName())
    setName('')
    // Keep the keyboard up for the next name.
    inputRef.current?.focus()
  }

  return (
    <Screen title={t('setup.players')} back footer={<DoneFooter />}>
      <form className="flex gap-2" onSubmit={submit}>
        <input
          ref={inputRef}
          className="input flex-1"
          placeholder={t('players.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoCapitalize="words"
          enterKeyHint="done"
        />
        <button
          type="submit"
          className="btn-primary w-[3.25rem] px-0"
          aria-label={t('players.add')}
        >
          <Plus size={24} />
        </button>
      </form>

      {players.length > 0 ? (
        <div className="group-list">
          {players.map((p, i) => (
            <div
              key={p.id}
              data-player-row
              className={`row relative pl-1 pr-1 ${
                dragging?.id === p.id ? 'z-10 bg-surface-2 shadow-lg shadow-black/40' : ''
              }`}
              style={
                dragging?.id === p.id
                  ? { transform: `translateY(${dragging.dy}px)` }
                  : undefined
              }
            >
              <button
                type="button"
                onPointerDown={(e) => onGripDown(e, p.id)}
                onPointerMove={onGripMove}
                onPointerUp={onGripUp}
                onPointerCancel={onGripUp}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' && i > 0) {
                    e.preventDefault()
                    movePlayer(i, i - 1)
                  } else if (e.key === 'ArrowDown' && i < players.length - 1) {
                    e.preventDefault()
                    movePlayer(i, i + 1)
                  }
                }}
                className="btn-icon -mr-2 cursor-grab touch-none text-foreground/40 active:cursor-grabbing"
                aria-label={t('players.reorder', { name: p.name })}
              >
                <GripVertical size={20} />
              </button>
              <button
                type="button"
                onClick={() => cycleAvatar(p.id)}
                className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2 active:scale-95"
                aria-label={t('players.changeAvatar')}
              >
                <img src={p.avatar} alt="" className="h-full w-full" />
              </button>
              <input
                className="min-w-0 flex-1 bg-transparent py-3 font-medium focus:outline-none"
                defaultValue={p.name}
                maxLength={20}
                autoCapitalize="words"
                aria-label={t('players.rename', { name: p.name })}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== p.name) renamePlayer(p.id, v)
                  else e.target.value = p.name
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
              <button
                type="button"
                onClick={() => removePlayer(p.id)}
                className="btn-icon text-foreground/50"
                aria-label={t('players.remove', { name: p.name })}
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-1 text-center muted">{t('players.empty')}</p>
      )}

      <p className="px-1 text-center text-sm muted">
        {players.length < 3
          ? t('players.needMore', { count: 3 - players.length })
          : t('players.tip')}
      </p>
    </Screen>
  )
}

/* -------------------------------------------------------------------- words */

export function WordsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const editor = useSettingsEditor()
  const selected = editor.settings.pairSource.selectedCategoryIds
  const { toggleCategory: toggle, selectAll, clearAll } = editor

  const categories = listCategories(editor.lists, t)
  const selectedSet = new Set(selected)
  const allSelected = categories
    .filter((c) => c.pairCount > 0)
    .every((c) => selectedSet.has(c.id))

  return (
    <Screen
      title={t('setup.words')}
      back
      footer={
        <>
          {selected.length === 0 && (
            <p className="text-center text-sm text-spy">{t('words.pickOne')}</p>
          )}
          <DoneFooter />
        </>
      }
    >
      <div className="flex items-center justify-between px-1">
        <span className="muted">
          {t('setup.categoryCount', { count: selected.length })}
        </span>
        <button
          type="button"
          onClick={allSelected ? clearAll : selectAll}
          className="min-h-11 px-2 font-semibold text-accent"
        >
          {allSelected ? t('words.selectNone') : t('words.selectAll')}
        </button>
      </div>

      <div className="group-list">
        {categories.map((c) => {
          const Icon = iconFor(c.id, c.icon)
          const sel = selectedSet.has(c.id)
          // Lists shared by someone else in the room can be picked, not edited.
          const listId = c.isCustom ? c.id.slice('custom:'.length) : null
          const editable = listId !== null && editor.ownListIds.has(listId)
          return (
            <div key={c.id} className="flex items-center">
              <button
                type="button"
                onClick={() => toggle(c.id)}
                disabled={c.pairCount === 0}
                role="checkbox"
                aria-checked={sel}
                className="row min-w-0 flex-1 disabled:opacity-40"
              >
                <span className="row-icon">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-sm tabular-nums muted">
                  {t('words.pairCount', { count: c.pairCount })}
                </span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    sel ? 'border-accent bg-accent text-background' : 'border-foreground/25'
                  }`}
                >
                  {sel && <Check size={14} strokeWidth={3} />}
                </span>
              </button>
              {editable && (
                <button
                  type="button"
                  onClick={() => navigate(`/lists/${listId}`)}
                  className="btn-icon mr-1 text-foreground/60"
                  aria-label={t('words.editList')}
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
          )
        })}
        <button type="button" onClick={() => navigate('/lists/new')} className="row">
          <span className="row-icon">
            <Plus size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{t('words.newList')}</span>
            <span className="block text-sm muted">{t('words.newListDesc')}</span>
          </span>
        </button>
      </div>
    </Screen>
  )
}

/* -------------------------------------------------------------------- spies */

export function SpiesPage() {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const { settings, setSettings } = useSettingsEditor()
  const localCount = useGame((s) => s.players.length)

  const playerCount = Number(params.get('players') ?? localCount) || 0
  const max = maxSpiesFor(Math.max(playerCount, 3))
  const options = Array.from({ length: Math.min(max, 5) }, (_, i) => i + 1)
  const active = availableSpyCounts(settings.spyCount, Math.max(playerCount, 3))
  const canHaveMany = active[active.length - 1] > 1

  const toggle = (n: number) => {
    // Start from what's actually in effect, so counts hidden by a smaller group don't linger.
    setSettings({ spyCount: toggleSpyCount(active, n) })
  }

  return (
    <Screen title={t('setup.spies')} back footer={<DoneFooter />}>
      <section>
        <div className="section-label">{t('spies.count')}</div>
        <div className="flex flex-wrap gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={active.includes(n)}
              onClick={() => toggle(n)}
              className="chip"
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-3 px-1 text-sm muted">
          {active.length > 1
            ? t('spies.randomPick', {
                list: new Intl.ListFormat(i18n.language, { type: 'disjunction' }).format(
                  active.map(String),
                ),
              })
            : t('spies.pickHint')}
        </p>
        <p className="mt-1 px-1 text-sm muted">
          {playerCount >= 3
            ? t('spies.maxHint', { players: playerCount, max })
            : t('spies.fewPlayers')}
        </p>
      </section>

      <section className="group-list">
        <div className="row py-3">
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{t('spies.knowLabel')}</span>
            <span className="block text-sm muted">
              {canHaveMany ? t('spies.knowHint') : t('spies.knowNeedsTwo')}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.spiesKnowEachOther}
            aria-label={t('spies.knowLabel')}
            disabled={!canHaveMany}
            onClick={() =>
              setSettings({ spiesKnowEachOther: !settings.spiesKnowEachOther })
            }
            className="switch"
          />
        </div>
      </section>
    </Screen>
  )
}

/* --------------------------------------------------------------------- hint */

export function HintPage() {
  const { t } = useTranslation()
  const { settings, setSettings } = useSettingsEditor()
  const difficulty = settings.difficulty
  const ex = hintExample()
  const spyWord = ex.hints

  return (
    <Screen title={t('setup.hint')} back footer={<DoneFooter />}>
      <p className="px-1 muted">{t('hint.intro')}</p>
      <div className="space-y-2" role="radiogroup">
        {DIFFICULTIES.map((lvl) => (
          <button
            key={lvl}
            type="button"
            role="radio"
            aria-checked={difficulty === lvl}
            onClick={() => setSettings({ difficulty: lvl })}
            className="option flex-col items-stretch gap-3"
          >
            <span className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{t(`hint.${lvl}.label`)}</span>
                <span className="block text-sm muted">{t(`hint.${lvl}.desc`)}</span>
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  difficulty === lvl
                    ? 'border-accent bg-accent text-background'
                    : 'border-border'
                }`}
              >
                {difficulty === lvl && <Check size={14} strokeWidth={3} />}
              </span>
            </span>
            <span className="grid grid-cols-2 gap-2 text-sm">
              <span className="rounded-xl bg-surface-2 px-3 py-2">
                <span className="block text-xs muted">{t('hint.exampleWord')}</span>
                <span className="block font-semibold">{ex.word}</span>
              </span>
              <span className="rounded-xl bg-surface-2 px-3 py-2">
                <span className="block text-xs muted">{t('hint.exampleHint')}</span>
                <span className={`block font-semibold ${spyWord[lvl] ? '' : 'muted'}`}>
                  {spyWord[lvl] ?? t('card.noHint')}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </Screen>
  )
}

/* -------------------------------------------------------------------- timer */

const TIMER_OPTIONS = [0, 60, 120, 180, 300, 600]

export function TimerPage() {
  const { t } = useTranslation()
  const { settings, setSettings } = useSettingsEditor()
  const timerSeconds = settings.timerSeconds
  return (
    <Screen title={t('setup.timer')} back footer={<DoneFooter />}>
      <p className="px-1 muted">{t('timer.intro')}</p>
      <div className="group-list" role="radiogroup">
        {TIMER_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={timerSeconds === s}
            onClick={() => setSettings({ timerSeconds: s })}
            className="row"
          >
            <span className="flex-1 font-medium">
              {s === 0 ? t('setup.off') : t('setup.minutes', { count: s / 60 })}
            </span>
            {timerSeconds === s && <Check size={20} className="text-accent" />}
          </button>
        ))}
      </div>
    </Screen>
  )
}
