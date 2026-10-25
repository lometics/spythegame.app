import { createElement, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import Screen from '../components/Screen'
import { useGame } from '../game/state'
import { readListLink } from '../game/listLink'
import { DEFAULT_LIST_ICON, iconFor, isListIcon } from '../game/icons'

/** Opened from a shared list link (/list#…): preview it and add it to your lists. */
export default function ImportList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const upsert = useGame((s) => s.upsertCustomList)
  const [added, setAdded] = useState(false)
  const list = readListLink(hash)

  if (!list) {
    return (
      <Screen title={t('lists.importTitle')} back="/">
        <p className="card text-center">{t('lists.importInvalid')}</p>
      </Screen>
    )
  }

  const icon = isListIcon(list.icon) ? list.icon : DEFAULT_LIST_ICON

  const add = () => {
    upsert({ id: crypto.randomUUID(), name: list.name, icon, pairs: list.pairs, createdAt: Date.now() })
    setAdded(true)
  }

  return (
    <Screen
      title={t('lists.importTitle')}
      back="/"
      footer={
        added ? (
          <button type="button" className="btn-primary w-full" onClick={() => navigate('/options')}>
            <Check size={20} />
            {t('lists.imported')}
          </button>
        ) : (
          <button type="button" className="btn-primary w-full" onClick={add}>
            {t('lists.importButton')}
          </button>
        )
      }
    >
      <section className="card flex items-center gap-3">
        <span className="row-icon">
          {createElement(iconFor('custom', icon), { size: 20 })}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{list.name}</span>
          <span className="block text-sm muted">{t('words.pairCount', { count: list.pairs.length })}</span>
        </span>
      </section>
      <section className="group-list">
        {list.pairs.slice(0, 50).map((p, i) => (
          <div key={i} className="row">
            <span className="min-w-0 flex-1 truncate">{p.civilian}</span>
            <span className="min-w-0 flex-1 truncate text-end muted">{p.spy}</span>
          </div>
        ))}
      </section>
    </Screen>
  )
}
