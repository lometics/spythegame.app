import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCw, UserCircle2 } from 'lucide-react'

type Props = {
  playerName: string
  word: string
  isSpy: boolean
  avatar?: string
  /** When true, the card never auto-hides on prop change — used by online mode where the card belongs to one viewer. */
  persistFlip?: boolean
  /** Names of fellow spies, shown to a spy when "spies know each other" is enabled. */
  fellowSpyNames?: string[]
}

export default function PlayerCard({
  playerName,
  word,
  isSpy,
  avatar,
  persistFlip = false,
  fellowSpyNames,
}: Props) {
  const { t } = useTranslation()
  const [flipped, setFlipped] = useState(false)
  void persistFlip

  const onClick = () => setFlipped((f) => !f)

  return (
    <div
      className={`flip-card w-full h-full ${flipped ? 'flipped' : ''}`}
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
        <div className="flip-card-face bg-ink-800 border border-white/10 shadow-soft p-4 sm:p-6">
          {avatar && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${avatar})`,
                backgroundSize: '85%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center 55%',
                opacity: 0.08,
                filter: 'blur(3px)',
              }}
            />
          )}
          <div className="relative flex items-center justify-between text-xs uppercase tracking-wide text-foreground/50">
            <span>{t('playerCard.spyHeader')}</span>
            <span>🕵️</span>
          </div>
          <div className="relative flex-1 flex flex-col items-center justify-center text-center gap-3 min-h-0">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/15 bg-ink-700/60 shadow-soft"
              />
            ) : (
              <UserCircle2
                size={72}
                strokeWidth={1.2}
                className="text-foreground/30"
              />
            )}
            <h2 className="font-display text-2xl sm:text-4xl font-bold break-words max-w-full">
              {t('playerCard.cardOwner', { name: playerName })}
            </h2>
            <div className="text-foreground/50 text-sm max-w-xs">
              {t('playerCard.passInstruction')}
            </div>
          </div>
          <div className="relative flex items-center justify-center gap-1.5 text-xs text-foreground/50">
            <RotateCw size={12} aria-hidden />
            {t('playerCard.tapToFlip')}
          </div>
        </div>

        {/* FRONT */}
        <div
          className={`flip-card-face flip-card-back p-4 sm:p-6 border-2 shadow-soft ${
            isSpy
              ? 'bg-rose-950 border-rose-500/60'
              : 'bg-emerald-950 border-emerald-500/50'
          }`}
        >
          {avatar && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${avatar})`,
                backgroundSize: '90%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center 60%',
                opacity: 0.1,
                filter: 'blur(4px) saturate(0.6)',
              }}
            />
          )}
          <div className="relative flex items-center justify-between text-xs uppercase tracking-wide text-foreground/60">
            <span className="truncate">{playerName}</span>
            <span>{isSpy ? t('playerCard.spyRole') : t('playerCard.civRole')}</span>
          </div>
          <div className="relative flex-1 flex flex-col items-center justify-center text-center gap-2.5 min-h-0 overflow-auto py-2">
            {isSpy ? (
              <>
                <div className="inline-block bg-rose-500 text-white px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wide">
                  {t('playerCard.spyBadge')}
                </div>
                {fellowSpyNames !== undefined && (
                  <div className="w-full max-w-xs space-y-1">
                    <div className="label-tiny text-rose-300/80">
                      {t('playerCard.fellowSpiesLabel')}
                    </div>
                    {fellowSpyNames.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1">
                        {fellowSpyNames.map((n) => (
                          <span
                            key={n}
                            className="inline-block bg-rose-500/20 border border-rose-400/40 text-rose-100 px-2 py-0.5 rounded-full text-xs font-semibold"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-rose-300/70 text-xs italic">
                        {t('playerCard.aloneSpy')}
                      </div>
                    )}
                  </div>
                )}
                {word ? (
                  <>
                    <p className="text-rose-200/80 text-xs max-w-xs leading-relaxed">
                      {t('playerCard.spyHeadsUp_before')}
                      {t('playerCard.spyHeadsUp_mid')}
                      <em>{t('playerCard.spyHeadsUp_not')}</em>
                      {t('playerCard.spyHeadsUp_after')}
                      {t('playerCard.spyHeadsUp_hint')}
                      {t('playerCard.spyHeadsUp_tail')}
                    </p>
                    <div className="label-tiny text-rose-300/80 mt-1">
                      {t('playerCard.yourHint')}
                    </div>
                    <div className="font-display text-3xl sm:text-5xl font-bold text-rose-100 break-words max-w-full">
                      {word}
                    </div>
                    <p className="text-rose-300/70 text-xs max-w-xs">
                      {t('playerCard.spyBluff')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-rose-200/80 text-xs max-w-xs leading-relaxed">
                      {t('playerCard.noHintTitle')}
                      {t('playerCard.noHintBody')}
                    </p>
                    <div className="label-tiny text-rose-300/80 mt-1">
                      {t('playerCard.yourHint')}
                    </div>
                    <div className="font-display text-2xl sm:text-4xl font-bold text-rose-100/70 break-words max-w-full italic">
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
                <div className="inline-block bg-emerald-500 text-ink-900 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wide">
                  {t('playerCard.civBadge')}
                </div>
                <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xs">
                  {t('playerCard.civBody')}
                </p>
                <div className="label-tiny text-emerald-300/80 mt-1">
                  {t('playerCard.yourWord')}
                </div>
                <div className="font-display text-3xl sm:text-5xl font-bold text-emerald-100 break-words max-w-full">
                  {word}
                </div>
              </>
            )}
          </div>
          <div className="relative flex items-center justify-center gap-1.5 text-xs text-foreground/60">
            <RotateCw size={12} aria-hidden />
            {t('playerCard.tapToHide')}
          </div>
        </div>
      </div>
    </div>
  )
}
