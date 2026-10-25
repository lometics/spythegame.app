import { useTranslation } from 'react-i18next'
import DiscussionTimer from './DiscussionTimer'
import { useGame } from '../game/state'
import { categoryName } from '../game/pairs'
import type { Pair } from '../game/types'

type Person = { id: string; name: string; avatar?: string }

/** Discussion phase body: who starts, the clue order, optional timer. */
export function DiscussionView({
  order,
  timerSeconds,
}: {
  /** Players already rotated so the first clue giver is first. */
  order: Person[]
  timerSeconds: number
}) {
  const { t } = useTranslation()
  return (
    <>
      <div className="text-center">
        <div className="text-sm muted">{t('discuss.starts')}</div>
        <div className="text-3xl font-extrabold text-accent">{order[0]?.name}</div>
        <p className="mx-auto mt-2 max-w-xs text-sm muted">{t('discuss.howTo')}</p>
      </div>

      {timerSeconds > 0 && <DiscussionTimer seconds={timerSeconds} />}

      <section>
        <div className="section-label">{t('discuss.order')}</div>
        <ol className="group-list">
          {order.map((p, i) => (
            <li key={p.id} className="row min-h-[3.25rem]">
              <span className="w-6 text-center tabular-nums muted">{i + 1}</span>
              {p.avatar && (
                <img
                  src={p.avatar}
                  alt=""
                  className="h-8 w-8 rounded-full border border-border bg-surface-2"
                />
              )}
              <span className="font-medium">{p.name}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

/** Result phase body: who the spies were and both words. */
export function ResultView({ spies, pair }: { spies: Person[]; pair: Pair | null }) {
  const { t } = useTranslation()
  const customLists = useGame((s) => s.customLists)
  return (
    <>
      <section className="card flex flex-col items-center gap-4 py-8 text-center">
        <div className="text-sm muted">
          {spies.length > 1 ? t('result.spiesWere') : t('result.spyWas')}
        </div>
        {spies.some((s) => s.avatar) && (
          <div className="flex justify-center -space-x-3">
            {spies.map((s) =>
              s.avatar ? (
                <img
                  key={s.id}
                  src={s.avatar}
                  alt=""
                  className="h-20 w-20 rounded-full border-2 border-spy bg-surface-2"
                />
              ) : null,
            )}
          </div>
        )}
        <div className="text-3xl font-extrabold text-spy">
          {spies.length > 0 ? spies.map((s) => s.name).join(', ') : '—'}
        </div>
      </section>

      {pair && (
        <section className="grid grid-cols-2 gap-2">
          <div className="card text-center">
            <div className="text-xs font-semibold uppercase tracking-wider muted">
              {t('result.civilians')}
            </div>
            <div className="mt-1 break-words text-xl font-bold">{pair.civilian}</div>
          </div>
          <div className="card text-center">
            <div className="text-xs font-semibold uppercase tracking-wider muted">
              {t('result.spy')}
            </div>
            <div className={`mt-1 break-words text-xl font-bold ${pair.spy ? '' : 'muted'}`}>
              {pair.spy || t('card.noHint')}
            </div>
          </div>
          <div className="col-span-2 text-center text-sm muted">
            {t('result.category', {
              name: categoryName(pair.categoryId, customLists, t),
            })}
          </div>
        </section>
      )}
    </>
  )
}
