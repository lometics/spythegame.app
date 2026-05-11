import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  playerName: string
  word: string
  isSpy: boolean
  /** When true, the card never auto-hides on prop change — used by online mode where the card belongs to one viewer. */
  persistFlip?: boolean
}

export default function PlayerCard({
  playerName,
  word,
  isSpy,
  persistFlip = false,
}: Props) {
  const { t } = useTranslation()
  const [flipped, setFlipped] = useState(false)
  void persistFlip

  const onClick = () => setFlipped((f) => !f)

  return (
    <div
      className={`flip-card w-full ${flipped ? 'flipped' : ''}`}
      style={{ aspectRatio: '3 / 4', minHeight: 'min(520px, 70vh)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setFlipped((f) => !f)
        }
      }}
    >
      <div className="flip-card-inner">
        {/* BACK */}
        <div className="flip-card-face bg-ink-800 border border-white/10 shadow-soft p-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
            <span>{t('playerCard.spyHeader')}</span>
            <span>🕵️</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-6xl">📲</div>
            <div className="text-slate-400">{t('playerCard.passTo')}</div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold">
              {playerName}
            </h2>
            <div className="text-slate-500 text-sm max-w-xs">
              {t('playerCard.passInstruction')}
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 uppercase tracking-widest">
            {t('playerCard.tapToFlip')}
          </div>
        </div>

        {/* FRONT */}
        <div
          className={`flip-card-face flip-card-back p-6 border-2 shadow-soft ${
            isSpy
              ? 'bg-rose-500/10 border-rose-500/60'
              : 'bg-emerald-500/5 border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
            <span>{playerName}</span>
            <span>{isSpy ? t('playerCard.spyRole') : t('playerCard.civRole')}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            {isSpy ? (
              <>
                <div className="inline-block bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-widest">
                  {t('playerCard.spyBadge')}
                </div>
                {word ? (
                  <>
                    <p className="text-rose-200 text-sm max-w-xs leading-relaxed">
                      <strong className="text-rose-100">
                        {t('playerCard.spyHeadsUp_before')}
                      </strong>
                      {t('playerCard.spyHeadsUp_mid')}
                      <em>{t('playerCard.spyHeadsUp_not')}</em>
                      {t('playerCard.spyHeadsUp_after')}
                      <strong className="text-rose-100">
                        {t('playerCard.spyHeadsUp_hint')}
                      </strong>
                      {t('playerCard.spyHeadsUp_tail')}
                    </p>
                    <div className="label text-rose-300/80 mt-2">
                      {t('playerCard.yourHint')}
                    </div>
                    <div className="font-display text-5xl sm:text-6xl font-extrabold text-rose-100 break-words max-w-full">
                      {word}
                    </div>
                    <p className="text-rose-300/70 text-xs max-w-xs">
                      {t('playerCard.spyBluff')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-rose-200 text-sm max-w-xs leading-relaxed">
                      <strong className="text-rose-100">
                        {t('playerCard.noHintTitle')}
                      </strong>
                      {t('playerCard.noHintBody')}
                    </p>
                    <div className="label text-rose-300/80 mt-2">
                      {t('playerCard.yourHint')}
                    </div>
                    <div className="font-display text-4xl sm:text-5xl font-extrabold text-rose-100/70 break-words max-w-full italic">
                      {t('playerCard.noHintPlaceholder')}
                    </div>
                    <p className="text-rose-300/70 text-xs max-w-xs">
                      {t('playerCard.noHintBluff')}
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="inline-block bg-emerald-500 text-ink-900 px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-widest">
                  {t('playerCard.civBadge')}
                </div>
                <p className="text-emerald-100/80 text-sm max-w-xs">
                  {t('playerCard.civBody')}
                </p>
                <div className="label text-emerald-300/80 mt-2">
                  {t('playerCard.yourWord')}
                </div>
                <div className="font-display text-5xl sm:text-6xl font-extrabold text-emerald-100 break-words max-w-full">
                  {word}
                </div>
              </>
            )}
          </div>
          <div className="text-center text-xs text-slate-400 uppercase tracking-widest">
            {t('playerCard.tapToHide')}
          </div>
        </div>
      </div>
    </div>
  )
}
