import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import Screen from '../components/Screen'
import Sheet from '../components/Sheet'
import { PassCard, RoleCard } from '../components/RoleCard'
import { DiscussionView, ResultView } from '../components/RoundViews'
import InstallPrompt from '../components/InstallPrompt'
import { useGame } from '../game/state'
import { clueOrder } from '../game/machine'
import type { Pair, Player } from '../game/types'

function fellowSpies(players: Player[], me: Player): string[] {
  return players.filter((p) => p.isSpy && p.id !== me.id).map((p) => p.name)
}

/** One player's turn with the phone: covered until they choose to look. */
function SecretCard({
  player,
  players,
  pair,
  shown,
  spiesKnowEachOther,
}: {
  player: Player
  players: Player[]
  pair: Pair
  shown: boolean
  spiesKnowEachOther: boolean
}) {
  if (!shown) return <PassCard name={player.name} avatar={player.avatar} />
  return (
    <RoleCard
      name={player.name}
      isSpy={player.isSpy}
      word={player.isSpy ? pair.spy : pair.civilian}
      hintLevel={pair.hintLevel}
      fellowSpyNames={
        player.isSpy && spiesKnowEachOther ? fellowSpies(players, player) : undefined
      }
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

  const [shown, setShown] = useState(false)
  const [peekOpen, setPeekOpen] = useState(false)
  const [confirmReveal, setConfirmReveal] = useState(false)

  if (phase === 'lobby' || !pair || players.length === 0) {
    return <Navigate to="/local" replace />
  }

  if (phase === 'reveal') {
    const player = players[revealIndex] ?? players[0]
    const isLast = revealIndex >= players.length - 1
    const back = () => {
      if (shown) setShown(false)
      else if (revealIndex > 0) setRevealIndex(revealIndex - 1)
      else navigate('/local')
    }
    const next = () => {
      setShown(false)
      if (isLast) goToDiscussion()
      else setRevealIndex(revealIndex + 1)
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
          shown ? (
            <button type="button" className="btn-primary w-full" onClick={next}>
              <EyeOff size={20} />
              {isLast ? t('reveal.hideAndDiscuss') : t('reveal.hideAndPass')}
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
          )
        }
      >
        <div className="flex flex-1 flex-col justify-center">
          <SecretCard
            key={`${player.id}-${shown}`}
            player={player}
            players={players}
            pair={pair}
            shown={shown}
            spiesKnowEachOther={settings.spiesKnowEachOther}
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
              onClick={() => setPeekOpen(true)}
            >
              <Eye size={20} />
              {t('peek.button')}
            </button>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => setConfirmReveal(true)}
            >
              {t('discuss.reveal')}
            </button>
          </>
        }
      >
        <DiscussionView
          order={clueOrder(players, firstClueGiverId)}
          timerSeconds={settings.timerSeconds}
        />
        <PeekSheet
          open={peekOpen}
          onClose={() => setPeekOpen(false)}
          players={players}
          pair={pair}
          spiesKnowEachOther={settings.spiesKnowEachOther}
        />
        <Sheet
          open={confirmReveal}
          onClose={() => setConfirmReveal(false)}
          title={t('discuss.confirmTitle')}
        >
          <p className="pb-4 muted">{t('discuss.confirmBody')}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                setConfirmReveal(false)
                revealAnswer()
              }}
            >
              {t('discuss.reveal')}
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => setConfirmReveal(false)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </Sheet>
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

/** Lets a player who forgot their word look again, mid-round. */
function PeekSheet({
  open,
  onClose,
  players,
  pair,
  spiesKnowEachOther,
}: {
  open: boolean
  onClose: () => void
  players: Player[]
  pair: Pair
  spiesKnowEachOther: boolean
}) {
  const { t } = useTranslation()
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [shown, setShown] = useState(false)
  const picked = players.find((p) => p.id === pickedId) ?? null

  const close = () => {
    setPickedId(null)
    setShown(false)
    onClose()
  }

  return (
    <Sheet open={open} onClose={close} title={t('peek.title')}>
      {!picked ? (
        <>
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
            spiesKnowEachOther={spiesKnowEachOther}
          />
          {shown ? (
            <button type="button" className="btn-primary w-full" onClick={close}>
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
    </Sheet>
  )
}
