import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Crown, Eye, EyeOff, Share2, X } from 'lucide-react'
import Screen from '../components/Screen'
import Sheet from '../components/Sheet'
import QrCode from '../components/QrCode'
import SettingsSummary from '../components/SettingsSummary'
import { RoleCard } from '../components/RoleCard'
import { DiscussionView, ResultView } from '../components/RoundViews'
import {
  backToLobby,
  joinRoom,
  kickPlayer,
  leaveRoom,
  renamePlayerInRoom,
  revealOnline,
  setPhase,
  startOnlineRound,
  useMyPrivate,
  usePairReveal,
  useRoom,
} from '../online/room'
import { ensureSignedIn, isFirebaseConfigured } from '../online/firebase'
import { resolveHost, sortedRoster, type RosterEntry } from '../online/roster'
import { useGame } from '../game/state'
import { clueOrder } from '../game/machine'

export default function OnlineRoom() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [uid, setUid] = useState<string | null>(null)
  const room = useRoom(code)
  const myPrivate = useMyPrivate(code, uid ?? undefined)
  const pairReveal = usePairReveal(code, room.meta?.phase === 'result')
  const settings = useGame((s) => s.settings)
  const customLists = useGame((s) => s.customLists)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Which round the card was uncovered for; a new round starts covered.
  const [shownRound, setShownRound] = useState<number | null>(null)
  const [peekOpen, setPeekOpen] = useState(false)
  const [confirmReveal, setConfirmReveal] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured()) return
    ensureSignedIn()
      .then((u) => setUid(u.uid))
      .catch(() => setUid(null))
  }, [])

  const roster = sortedRoster(room.players)
  const me = uid ? room.players[uid] : undefined
  const hostId = resolveHost(room.meta, roster)
  const isHost = !!uid && uid === hostId
  const phase = room.meta?.phase
  const cardShown = shownRound !== null && shownRound === room.meta?.round
  const toggleCard = () =>
    setShownRound(cardShown ? null : (room.meta?.round ?? null))

  // Leave the room view once we were in it and then got removed (kicked / room deleted).
  const wasInRoomRef = useRef(false)
  useEffect(() => {
    if (me) wasInRoomRef.current = true
  }, [me])
  useEffect(() => {
    if (!wasInRoomRef.current) return
    if ((room.playersLoaded && uid && !me) || (room.loaded && !room.meta)) {
      navigate('/', { replace: true })
    }
  }, [room.playersLoaded, room.loaded, room.meta, uid, me, navigate])


  if (!isFirebaseConfigured()) {
    return (
      <Screen title={code} back="/">
        <p className="card text-sm text-spy">{t('online.fbNotConfigured')}</p>
      </Screen>
    )
  }
  if (room.loaded && !room.meta) {
    return (
      <Screen title={code} back="/">
        <p className="card text-center">{t('online.errRoomNotFound')}</p>
      </Screen>
    )
  }
  if (!room.meta || !room.playersLoaded || !uid) {
    return (
      <Screen title={code} back="/">
        <p className="text-center muted">{t('online.loadingRoom', { code })}</p>
      </Screen>
    )
  }
  if (!me) return <JoinGate code={code} />

  const startRound = async () => {
    setBusy(true)
    setError(null)
    try {
      await startOnlineRound(
        code,
        settings.pairSource,
        customLists,
        room.players,
        settings.difficulty,
        settings.spyCount,
        settings.spiesKnowEachOther,
        settings.timerSeconds,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errStartRound'))
    } finally {
      setBusy(false)
    }
  }

  const leave = async () => {
    await leaveRoom(code, uid).catch(() => {})
    navigate('/')
  }

  const waiting = (text: string) => (
    <p className="py-3 text-center text-sm muted">{text}</p>
  )

  const card = (
    <RoleCard
      name={me.name}
      isSpy={myPrivate.isSpy}
      word={myPrivate.word ?? ''}
      hintLevel={room.round?.hintLevel}
      fellowSpyNames={myPrivate.fellowSpyNames ?? undefined}
    />
  )

  if (phase === 'reveal') {
    return (
      <Screen
        title={t('reveal.title')}
        back={leave}
        footer={
          <>
            <button
              type="button"
              className={isHost ? 'btn-secondary w-full' : 'btn-primary w-full'}
              onClick={toggleCard}
              disabled={myPrivate.word === null}
            >
              {cardShown ? <EyeOff size={20} /> : <Eye size={20} />}
              {cardShown ? t('peek.hide') : t('reveal.show')}
            </button>
            {isHost ? (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => setPhase(code, 'discussion')}
              >
                {t('online.toDiscussion')}
              </button>
            ) : (
              waiting(t('online.waitDiscussion'))
            )}
          </>
        }
      >
        <div className="flex flex-1 flex-col justify-center">
          {myPrivate.word === null ? (
            <p className="text-center muted">{t('online.loadingWord')}</p>
          ) : cardShown ? (
            card
          ) : (
            <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
              <EyeOff size={36} className="muted" />
              <div className="text-xl font-semibold">{t('online.cardReady')}</div>
              <p className="text-sm muted">{t('online.cardReadyHint')}</p>
            </div>
          )}
        </div>
      </Screen>
    )
  }

  if (phase === 'discussion') {
    return (
      <Screen
        title={t('discuss.title')}
        back={leave}
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
            {isHost ? (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => setConfirmReveal(true)}
              >
                {t('discuss.reveal')}
              </button>
            ) : (
              waiting(t('online.waitReveal'))
            )}
          </>
        }
      >
        <DiscussionView
          order={clueOrder(roster, room.round?.firstClueGiverId ?? null)}
          timerSeconds={room.round?.timerSeconds ?? 180}
        />
        <Sheet open={peekOpen} onClose={() => setPeekOpen(false)} title={t('peek.title')}>
          {card}
        </Sheet>
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
                revealOnline(code)
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

  if (phase === 'result') {
    const spyIds = pairReveal?.spyUids ?? (pairReveal?.spyUid ? [pairReveal.spyUid] : [])
    return (
      <Screen
        title={t('result.title')}
        back={leave}
        footer={
          isHost ? (
            <>
              {error && <p className="text-center text-sm text-spy">{error}</p>}
              <button
                type="button"
                className="btn-primary w-full"
                disabled={busy || roster.length < 3}
                onClick={startRound}
              >
                {t('result.nextRound')}
              </button>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => backToLobby(code)}
              >
                {t('online.backToLobby')}
              </button>
            </>
          ) : (
            waiting(t('online.waitNext'))
          )
        }
      >
        <ResultView
          spies={roster.filter((p) => spyIds.includes(p.id))}
          pair={pairReveal?.pair ?? null}
        />
      </Screen>
    )
  }

  // Lobby
  const blocker =
    roster.length < 3
      ? t('online.needPlayers', { count: 3 - roster.length })
      : settings.pairSource.selectedCategoryIds.length === 0
        ? t('words.pickOne')
        : null

  return (
    <Screen
      title={t('online.roomTitle', { code })}
      back={leave}
      footer={
        isHost ? (
          <>
            {(blocker || error) && (
              <p className="text-center text-sm muted">{blocker ?? error}</p>
            )}
            <button
              type="button"
              className="btn-primary w-full"
              disabled={!!blocker || busy}
              onClick={startRound}
            >
              {busy ? t('online.starting') : t('setup.start')}
            </button>
          </>
        ) : (
          waiting(t('online.waitStart'))
        )
      }
    >
      <ShareCard code={code} />
      <PlayerList
        code={code}
        uid={uid}
        hostId={hostId}
        isHost={isHost}
        roster={roster}
      />
      {isHost && (
        <section>
          <div className="section-label">{t('online.roundSettings')}</div>
          <SettingsSummary playerCount={roster.length} />
        </section>
      )}
    </Screen>
  )
}

function ShareCard({ code }: { code: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const joinUrl = `${window.location.origin}/join/${code}`

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: t('meta.title'), url: joinUrl }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(joinUrl).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="card flex items-center gap-4">
      <QrCode value={joinUrl} size={104} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="text-sm muted">{t('online.roomCode')}</div>
        <div className="font-mono text-3xl font-bold tracking-[0.2em] text-accent">
          {code}
        </div>
        <button type="button" className="btn-secondary min-h-11 px-4 text-sm" onClick={share}>
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          {copied ? t('online.copied') : t('online.invite')}
        </button>
      </div>
    </section>
  )
}

function PlayerList({
  code,
  uid,
  hostId,
  isHost,
  roster,
}: {
  code: string
  uid: string
  hostId: string | null
  isHost: boolean
  roster: RosterEntry[]
}) {
  const { t } = useTranslation()
  const setOnlineName = useGame((s) => s.setOnlineName)

  return (
    <section>
      <div className="section-label">
        {t('setup.playerCount', { count: roster.length })}
      </div>
      <div className="group-list">
        {roster.map((p) => {
          const isMe = p.id === uid
          return (
            <div key={p.id} className="row pr-1">
              {isMe ? (
                <input
                  className="min-w-0 flex-1 bg-transparent py-3 font-medium focus:outline-none"
                  defaultValue={p.name}
                  maxLength={20}
                  autoCapitalize="words"
                  aria-label={t('online.yourName')}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (!v || v === p.name) {
                      e.target.value = p.name
                      return
                    }
                    setOnlineName(v)
                    renamePlayerInRoom(code, uid, v).catch(() => {})
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
              )}
              {isMe && <span className="text-sm muted">{t('online.you')}</span>}
              {p.id === hostId && (
                <Crown size={18} className="text-accent" aria-label={t('online.host')} />
              )}
              {isHost && !isMe ? (
                <button
                  type="button"
                  className="btn-icon text-foreground/50"
                  onClick={() => kickPlayer(code, p.id).catch(() => {})}
                  aria-label={t('online.kick', { name: p.name })}
                >
                  <X size={20} />
                </button>
              ) : (
                <span className="w-3" />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Someone opened a room link: join with the saved name, or ask for one first. */
function JoinGate({ code }: { code: string }) {
  const { t } = useTranslation()
  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = onlineName.trim()

  const join = async () => {
    setBusy(true)
    setError(null)
    try {
      await joinRoom(code, name)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  // Name already known from last time: join straight away, no extra tap.
  const autoJoinedRef = useRef(false)
  useEffect(() => {
    if (autoJoinedRef.current || !name) return
    autoJoinedRef.current = true
    join()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open
  }, [])

  return (
    <Screen
      title={t('online.roomTitle', { code })}
      back="/"
      footer={
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!name || busy}
          onClick={join}
        >
          {busy ? t('online.joining') : t('online.join')}
        </button>
      }
    >
      <section>
        <label className="section-label block" htmlFor="gate-name">
          {t('online.yourName')}
        </label>
        <input
          id="gate-name"
          className="input"
          value={onlineName}
          maxLength={20}
          autoFocus
          autoCapitalize="words"
          enterKeyHint="go"
          onChange={(e) => setOnlineName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name && join()}
        />
      </section>
      {error && <p className="text-center text-sm text-spy">{error}</p>}
    </Screen>
  )
}
