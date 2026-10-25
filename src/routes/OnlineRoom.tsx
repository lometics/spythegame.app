import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Eye, EyeOff, LogOut, Share2, X } from 'lucide-react'
import Screen from '../components/Screen'
import ConfirmBar from '../components/ConfirmBar'
import { shareOrCopy } from '../share'
import QrCode from '../components/QrCode'
import SettingsSummary from '../components/SettingsSummary'
import { RoleCard } from '../components/RoleCard'
import { DiscussionView, ResultView } from '../components/RoundViews'
import {
  backToLobby,
  joinRoom,
  kickPlayer,
  touchRoom,
  leaveRoom,
  renamePlayerInRoom,
  revealOnline,
  saveRoomSettings,
  setPhase,
  startOnlineRound,
  useMyPrivate,
  usePairReveal,
  useRoom,
} from '../online/room'
import { ensureSignedIn, isFirebaseConfigured } from '../online/firebase'
import { sortedRoster, type RosterEntry } from '../online/roster'
import { seedRoomSettings } from '../online/roomSettings'
import { useGame } from '../game/state'
import { clueOrder } from '../game/machine'

export default function OnlineRoom() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Set by "Create room": ask the creator's name once they're in.
  const askName = (location.state as { askName?: boolean } | null)?.askName === true
  const [uid, setUid] = useState<string | null>(null)
  const room = useRoom(code)
  const myPrivate = useMyPrivate(code, uid ?? undefined)
  const pairReveal = usePairReveal(code, room.meta?.phase === 'result')
  const settings = useGame((s) => s.settings)
  const customLists = useGame((s) => s.customLists)
  const activeRoom = useGame((s) => s.activeRoom)
  const setActiveRoom = useGame((s) => s.setActiveRoom)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Which round the card was uncovered for; a new round starts covered.
  const [shownRound, setShownRound] = useState<number | null>(null)
  const [peekOpen, setPeekOpen] = useState(false)
  const [confirmReveal, setConfirmReveal] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured()) return
    ensureSignedIn()
      .then((u) => setUid(u.uid))
      .catch(() => setUid(null))
  }, [])

  const roster = sortedRoster(room.players)
  const me = uid ? room.players[uid] : undefined
  const phase = room.meta?.phase
  const cardShown = shownRound !== null && shownRound === room.meta?.round
  const toggleCard = () =>
    setShownRound(cardShown ? null : (room.meta?.round ?? null))

  // Remember the room on this device, so reopening the app comes straight back.
  useEffect(() => {
    if (me && activeRoom !== code) setActiveRoom(code)
  }, [me, activeRoom, code, setActiveRoom])

  // Opening the room counts as using it (keeps it from being cleaned up).
  const isMember = !!me
  useEffect(() => {
    if (isMember) touchRoom(code).catch(() => {})
  }, [isMember, code])

  // Rooms from older builds have no shared settings yet: the first member here brings theirs.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!me || !room.settingsLoaded || room.settings || seededRef.current) return
    seededRef.current = true
    saveRoomSettings(code, seedRoomSettings(settings, customLists)).catch(() => {})
  }, [me, room.settingsLoaded, room.settings, code, settings, customLists])

  // Once we were in the room and then got removed (kicked / room deleted): forget it and go home.
  const wasInRoomRef = useRef(false)
  useEffect(() => {
    if (me) wasInRoomRef.current = true
  }, [me])
  const gone = room.loaded && !room.meta
  useEffect(() => {
    if (gone && activeRoom === code) setActiveRoom('')
    if (!wasInRoomRef.current) return
    if ((room.playersLoaded && uid && !me) || gone) {
      if (activeRoom === code) setActiveRoom('')
      navigate('/', { replace: true })
    }
  }, [room.playersLoaded, gone, uid, me, navigate, activeRoom, code, setActiveRoom])

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
  if (!me) return <NameStep code={code} />
  if (askName) {
    return (
      <NameStep
        code={code}
        uid={uid}
        onDone={() => navigate(location.pathname, { replace: true, state: null })}
      />
    )
  }

  // Everyone is equal: any player can move the game on, always with the room's settings.
  const startRound = async () => {
    if (!room.settings) return
    setBusy(true)
    setError(null)
    try {
      await startOnlineRound(code, room.settings, room.players)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errStartRound'))
    } finally {
      setBusy(false)
    }
  }

  // Back only goes home: you stay in the room until you leave on purpose.
  const leave = async () => {
    await leaveRoom(code, uid).catch(() => {})
    setActiveRoom('')
    navigate('/')
  }

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
        back="/"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={toggleCard}
              disabled={myPrivate.word === null}
            >
              {cardShown ? <EyeOff size={20} /> : <Eye size={20} />}
              {cardShown ? t('peek.hide') : t('reveal.show')}
            </button>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => setPhase(code, 'discussion')}
            >
              {t('online.toDiscussion')}
            </button>
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
        back="/"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => setPeekOpen(!peekOpen)}
            >
              {peekOpen ? <EyeOff size={20} /> : <Eye size={20} />}
              {peekOpen ? t('peek.hide') : t('peek.button')}
            </button>
            {confirmReveal ? (
              <ConfirmBar
                question={t('discuss.confirmBody')}
                confirmLabel={t('discuss.reveal')}
                onCancel={() => setConfirmReveal(false)}
                onConfirm={() => {
                  setConfirmReveal(false)
                  setPeekOpen(false)
                  revealOnline(code)
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
        {/* Hidden, not unmounted, while the card shows: the timer keeps running. */}
        <div className={peekOpen ? 'hidden' : 'flex flex-col gap-6'}>
          <DiscussionView
            order={clueOrder(roster, room.round?.firstClueGiverId ?? null)}
            timerSeconds={room.round?.timerSeconds ?? 180}
          />
        </div>
        {peekOpen && <div className="flex flex-1 flex-col justify-center">{card}</div>}
      </Screen>
    )
  }

  if (phase === 'result') {
    const spyIds = pairReveal?.spyUids ?? (pairReveal?.spyUid ? [pairReveal.spyUid] : [])
    return (
      <Screen
        title={t('result.title')}
        back="/"
        footer={
          <>
            {error && <p className="text-center text-sm text-spy">{error}</p>}
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy || roster.length < 3 || !room.settings}
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
      : room.settings && room.settings.settings.pairSource.selectedCategoryIds.length === 0
        ? t('words.pickOne')
        : null

  return (
    <Screen
      title={t('online.roomTitle', { code })}
      back="/"
      footer={
        <>
          {(blocker || error) && (
            <p className="text-center text-sm muted">{blocker ?? error}</p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!!blocker || busy || !room.settings}
            onClick={startRound}
          >
            {busy ? t('online.starting') : t('setup.start')}
          </button>
        </>
      }
    >
      <ShareCard code={code} />
      <PlayerList code={code} uid={uid} roster={roster} />
      {room.settings && (
        <section>
          <div className="section-label">{t('online.roundSettings')}</div>
          <SettingsSummary
            playerCount={roster.length}
            room={{ code, settings: room.settings }}
          />
        </section>
      )}
      <section className="mt-auto">
        {confirmLeave ? (
          <ConfirmBar
            question={t('online.leaveConfirm')}
            confirmLabel={t('online.leaveRoom')}
            danger
            onCancel={() => setConfirmLeave(false)}
            onConfirm={leave}
          />
        ) : (
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => setConfirmLeave(true)}
          >
            <LogOut size={18} />
            {t('online.leaveRoom')}
          </button>
        )}
      </section>
    </Screen>
  )
}

function ShareCard({ code }: { code: string }) {
  const { t, i18n } = useTranslation()
  const [copied, setCopied] = useState(false)
  // ?l= only sets the language of the link preview, not of the app.
  const joinUrl = `${window.location.origin}/join/${code}?l=${i18n.language.split('-')[0]}`

  const share = async () => {
    if ((await shareOrCopy({ title: t('share.invite', { code }), url: joinUrl })) === 'copied') {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
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
  roster,
}: {
  code: string
  uid: string
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
              {!isMe ? (
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

/**
 * Asks for the player's name, prefilled with the last one used. Without `uid`
 * it joins the room; with `uid` (just created the room) it renames and moves on.
 */
function NameStep({
  code,
  uid,
  onDone,
}: {
  code: string
  uid?: string
  onDone?: () => void
}) {
  const { t } = useTranslation()
  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = onlineName.trim()
  const joined = uid !== undefined

  const submit = async () => {
    if (!name || busy) return
    setBusy(true)
    setError(null)
    try {
      if (joined) {
        await renamePlayerInRoom(code, uid, name)
        onDone?.()
      } else {
        await joinRoom(code, name)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Screen
      title={t('online.roomTitle', { code })}
      back="/"
      footer={
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!name || busy}
          onClick={submit}
        >
          {busy ? t('online.joining') : joined ? t('online.continue') : t('online.join')}
        </button>
      }
    >
      <section>
        <label className="section-label block" htmlFor="name-step">
          {t('online.yourName')}
        </label>
        <input
          id="name-step"
          className="input"
          value={onlineName}
          maxLength={20}
          autoFocus
          autoCapitalize="words"
          enterKeyHint="go"
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setOnlineName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </section>
      {error && <p className="text-center text-sm text-spy">{error}</p>}
    </Screen>
  )
}
