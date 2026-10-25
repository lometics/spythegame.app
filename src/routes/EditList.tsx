import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Plus, Share2, Trash2, X } from 'lucide-react'
import Screen from '../components/Screen'
import ConfirmBar from '../components/ConfirmBar'
import { useGame } from '../game/state'
import { DEFAULT_LIST_ICON, LIST_ICONS } from '../game/icons'
import type { CustomList } from '../game/types'
import { listLink } from '../game/listLink'
import { shareOrCopy } from '../share'

type DraftPair = { civilian: string; spy: string }

export default function EditList() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const customLists = useGame((s) => s.customLists)
  const upsert = useGame((s) => s.upsertCustomList)
  const deleteList = useGame((s) => s.deleteCustomList)

  const existing = useMemo<CustomList | null>(
    () => (id ? (customLists.find((l) => l.id === id) ?? null) : null),
    [id, customLists],
  )

  const [name, setName] = useState(existing?.name ?? '')
  const [icon, setIcon] = useState(existing?.icon ?? DEFAULT_LIST_ICON)
  const [pairs, setPairs] = useState<DraftPair[]>(
    existing?.pairs.length
      ? existing.pairs.map((p) => ({ ...p }))
      : [{ civilian: '', spy: '' }],
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (id && !existing) {
    return (
      <Screen title={t('editList.notFound')} back>
        <p className="card muted">{t('editList.notFoundDesc')}</p>
      </Screen>
    )
  }

  const updatePair = (i: number, patch: Partial<DraftPair>) =>
    setPairs((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const addPair = () => {
    setPairs((ps) => [...ps, { civilian: '', spy: '' }])
    requestAnimationFrame(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-pair-civilian]')
      inputs[inputs.length - 1]?.focus()
    })
  }
  const removePair = (i: number) =>
    setPairs((ps) =>
      ps.length <= 1 ? [{ civilian: '', spy: '' }] : ps.filter((_, j) => j !== i),
    )

  const trimmedName = name.trim()
  const validPairs = pairs
    .map((p) => ({ civilian: p.civilian.trim(), spy: p.spy.trim() }))
    .filter((p) => p.civilian && p.spy)
  const canSave = trimmedName.length > 0 && validPairs.length > 0

  const save = () => {
    if (!canSave) return
    upsert({
      id: existing?.id ?? crypto.randomUUID(),
      name: trimmedName,
      icon,
      pairs: validPairs,
      createdAt: existing?.createdAt ?? Date.now(),
    })
    navigate(-1)
  }

  return (
    <Screen
      title={existing ? t('editList.headerEdit') : t('editList.headerNew')}
      back
      right={
        existing && (
          <button
            type="button"
            className="btn-icon text-spy"
            onClick={() => setConfirmDelete(true)}
            aria-label={t('common.delete')}
          >
            <Trash2 size={20} />
          </button>
        )
      }
      footer={
        confirmDelete ? (
          <ConfirmBar
            question={`${t('editList.deleteConfirmTitle')} ${t('editList.deleteConfirmDesc')}`}
            confirmLabel={t('common.delete')}
            danger
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => {
              if (existing) deleteList(existing.id)
              navigate(-1)
            }}
          />
        ) : (
          <button type="button" className="btn-primary w-full" disabled={!canSave} onClick={save}>
            {existing ? t('common.save') : t('editList.create')}
          </button>
        )
      }
    >
      <section>
        <label className="section-label block" htmlFor="list-name">
          {t('editList.name')}
        </label>
        <input
          id="list-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('editList.namePlaceholder')}
          maxLength={28}
          autoFocus={!existing}
        />
      </section>

      <section>
        <div className="section-label">{t('editList.icon')}</div>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(LIST_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-pressed={icon === key}
              aria-label={key}
              onClick={() => setIcon(key)}
              className="chip aspect-square min-h-0 min-w-0 px-0"
            >
              <Icon size={22} />
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-label">{t('editList.pairs')}</div>
        <p className="px-1 pb-3 text-sm muted">{t('editList.pairsHint')}</p>
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                data-pair-civilian
                className="input min-w-0 flex-1 px-3"
                value={p.civilian}
                onChange={(e) => updatePair(i, { civilian: e.target.value })}
                placeholder={t('editList.civilianPlaceholder')}
                maxLength={30}
                enterKeyHint="next"
              />
              <input
                className="input min-w-0 flex-1 px-3"
                value={p.spy}
                onChange={(e) => updatePair(i, { spy: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && i === pairs.length - 1) {
                    e.preventDefault()
                    addPair()
                  }
                }}
                placeholder={t('editList.spyPlaceholder')}
                maxLength={30}
                enterKeyHint="next"
              />
              <button
                type="button"
                onClick={() => removePair(i)}
                className="btn-icon text-foreground/50"
                aria-label={t('editList.removePairAria')}
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPair} className="btn-secondary mt-3 w-full">
          <Plus size={20} />
          {t('editList.addPair')}
        </button>
      </section>

      {existing && existing.pairs.length > 0 && <ShareListButton list={existing} />}
    </Screen>
  )
}

/** Shares the saved list as a link that adds it on the other phone. */
function ShareListButton({ list }: { list: CustomList }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = listLink(window.location.origin, list)
    if ((await shareOrCopy({ title: list.name, url })) === 'copied') {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
  }
  return (
    <button type="button" className="btn-secondary w-full" onClick={share}>
      {copied ? <Check size={20} /> : <Share2 size={20} />}
      {copied ? t('share.copied') : t('lists.share')}
    </button>
  )
}
