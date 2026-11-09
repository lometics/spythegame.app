import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Screen from '../components/Screen'
import ConfirmBar from '../components/ConfirmBar'
import { PassCard, RoleCard } from '../components/RoleCard'
import { DiscussionView, ResultView } from '../components/RoundViews'
import InstallPrompt from '../components/InstallPrompt'
import { RevealProgress } from '../components/RevealProgress'
import { useGame } from '../game/state'
import { clueOrder } from '../game/machine'
import { dealCard, type CardFlags } from '../game/cards'
import type { Pair, Player } from '../game/types'

/** One player's turn with the phone: covered until they choose to look. */
function SecretCard({
  player,
  players,
  pair,
  shown,
  flags,
  onPickAvatar,
}: {
  player: Player
  players: Player[]
  pair: Pair
  shown: boolean
  flags: CardFlags
  onPickAvatar?: (avatar: string) => void
}) {
  if (!shown) {
    return (
      <PassCard name={player.name} avatar={player.avatar} onPickAvatar={onPickAvatar} />
    )
  }
  const otherSpies = players
    .filter((p) => p.isSpy && p.id !== player.id)
    .map((p) => p.name)
  const card = dealCard(pair, player.isSpy, otherSpies, flags)
  return (
    <RoleCard
      name={player.name}
      isSpy={card.isSpy}
      word={card.word}
      hintLevel={pair.hintLevel}
      fellowSpyNames={card.fellowSpyNames}
      spyHint={card.spyHint}
      unaware={card.unaware}
    />
  )
}

export default function LocalGame() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const phase = useGame((s) => s.phase)
  const players = useGame((s) => s.players)
  const pair = useGame((s) => s.pair)
  const revealIndex = useGame((s) => s.revealIndex)
  const firstClueGiverId = useGame((s) => s.firstClueGiverId)
  const settings = useGame((s) => s.settings)
  const setRevealIndex = useGame((s) => s.setRevealIndex)
  const goToDiscussion = useGame((s) => s.goToDiscussion)
  const revealAnswer = useGame((s) => s.revealAnswer)
  const playAgain = useGame((s) => s.playAgainSamePlayers)
  const startRound = useGame((s) => s.startRound)
  const setAvatar = useGame((s) => s.setAvatar)

  const [shown, setShown] = useState(false)
  const [peekOpen, setPeekOpen] = useState(false)
  const [confirmReveal, setConfirmReveal] = useState(false)
  // Furthest card reached this round, so the track can jump forward again after going back.
  const [furthest, setFurthest] = useState(revealIndex)

  if (phase === 'lobby' || !pair || players.length === 0) {
    return <Navigate to="/local" replace />
  }

  if (phase === 'reveal') {
    const player = players[revealIndex] ?? players[0]
    const isLast = revealIndex >= players.length - 1
    const reached = Math.max(furthest, revealIndex)
    const jump = (i: number) => {
      setShown(false)
      setRevealIndex(i)
    }
    const back = () => {
      if (shown) setShown(false)
      else if (revealIndex > 0) jump(revealIndex - 1)
      else navigate('/local')
    }
    const next = () => {
      setShown(false)
      if (isLast) goToDiscussion()
      else {
        setFurthest(Math.max(reached, revealIndex + 1))
        setRevealIndex(revealIndex + 1)
      }
    }
    return (
      <Screen
        title={t('reveal.title')}
        back={back}
        right={
          <span className="pr-2 text-sm tabular-nums muted">
            {revealIndex + 1}/{players.length}
          </span>
        }
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary px-4" onClick={back}>
              <ChevronLeft size={20} className="rtl:rotate-180" />
              {t('common.back')}
            </button>
            {shown ? (
              <button type="button" className="btn-primary flex-1" onClick={next}>
                <EyeOff size={20} />
                {isLast ? t('reveal.hideAndDiscuss') : t('reveal.hideAndPass')}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => setShown(true)}
              >
                <Eye size={20} />
                {t('reveal.show')}
              </button>
            )}
          </div>
        }
      >
        <RevealProgress
          players={players}
          current={revealIndex}
          furthest={reached}
          onJump={jump}
        />
        <div className="flex flex-1 flex-col justify-center">
          <SecretCard
            key={`${player.id}-${shown}`}
            player={player}
            players={players}
            pair={pair}
            shown={shown}
            flags={settings}
            onPickAvatar={(a) => setAvatar(player.id, a)}
          />
        </div>
      </Screen>
    )
  }

  if (phase === 'discussion') {
    return (
      <Screen
        title={t('discuss.title')}
        back="/"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => setPeekOpen(!peekOpen)}
            >
              {!peekOpen && <Eye size={20} />}
              {peekOpen ? t('common.cancel') : t('peek.button')}
            </button>
            {confirmReveal ? (
              <ConfirmBar
                question={t('discuss.confirmBody')}
                confirmLabel={t('discuss.reveal')}
                onCancel={() => setConfirmReveal(false)}
                onConfirm={() => {
                  setConfirmReveal(false)
                  setPeekOpen(false)
                  revealAnswer()
                }}
              />
            ) : (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => setConfirmReveal(true)}
              >
                {t('discuss.reveal')}
              </button>
            )}
          </>
        }
      >
        {/* Hidden, not unmounted, while someone checks a card: the timer keeps running. */}
        <div className={peekOpen ? 'hidden' : 'flex flex-col gap-6'}>
          <DiscussionView
            order={clueOrder(players, firstClueGiverId)}
            timerSeconds={settings.timerSeconds}
          />
        </div>
        {peekOpen && (
          <PeekPanel
            players={players}
            pair={pair}
            flags={settings}
            onDone={() => setPeekOpen(false)}
          />
        )}
      </Screen>
    )
  }

  return (
    <Screen
      title={t('result.title')}
      back="/"
      footer={
        <>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              playAgain()
              if (startRound()) navigate('/local')
            }}
          >
            {t('result.nextRound')}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => {
              playAgain()
              navigate('/local')
            }}
          >
            {t('result.changeSetup')}
          </button>
        </>
      }
    >
      <ResultView spies={players.filter((p) => p.isSpy)} pair={pair} />
      <InstallPrompt />
    </Screen>
  )
}

/** Lets a player who forgot their word look again, mid-round, in place of the discussion. */
function PeekPanel({
  players,
  pair,
  flags,
  onDone,
}: {
  players: Player[]
  pair: Pair
  flags: CardFlags
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [shown, setShown] = useState(false)
  const picked = players.find((p) => p.id === pickedId) ?? null

  return (
    <section className="animate-in flex flex-1 flex-col justify-center">
      {!picked ? (
        <>
          <div className="pb-1 text-lg font-semibold">{t('peek.title')}</div>
          <p className="pb-3 text-sm muted">{t('peek.pick')}</p>
          <div className="group-list">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                className="row"
                onClick={() => setPickedId(p.id)}
              >
                <img
                  src={p.avatar}
                  alt=""
                  className="h-9 w-9 rounded-full border border-border bg-surface-2"
                />
                <span className="flex-1 font-medium">{p.name}</span>
                <ChevronRight size={20} className="text-foreground/30 rtl:rotate-180" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <SecretCard
            key={`${picked.id}-${shown}`}
            player={picked}
            players={players}
            pair={pair}
            shown={shown}
            flags={flags}
          />
          {shown ? (
            <button type="button" className="btn-primary w-full" onClick={onDone}>
              <EyeOff size={20} />
              {t('peek.hide')}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => setShown(true)}
            >
              <Eye size={20} />
              {t('reveal.show')}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
