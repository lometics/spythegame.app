import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import type { TFunction } from 'i18next'
import {
  backToLobby,
  kickPlayer,
  leaveRoom,
  rejoinIfMissing,
  renamePlayerInRoom,
  revealOnline,
  setPhase,
  startOnlineRound,
  useMyPrivate,
  usePairReveal,
  useRoom,
} from '../online/room'
import { ensureSignedIn, isFirebaseConfigured } from '../online/firebase'
import PairPicker from '../components/PairPicker'
import PlayerCard from '../components/PlayerCard'
import DiscussionTimer from '../components/DiscussionTimer'
import QrCode from '../components/QrCode'
import { useGame } from '../game/state'
import { categoryName } from '../game/pairs'
import { JoinRoomModal, OptionsPanel } from './Home'

export default function OnlineRoom() {
  const { t } = useTranslation()
  const { code } = useParams()
  const navigate = useNavigate()
  const [uid, setUid] = useState<string | null>(null)
  const room = useRoom(code)
  const myPrivate = useMyPrivate(code, uid ?? undefined)
  const pairReveal = usePairReveal(code, room.meta?.phase === 'result')
  const [joinOpen, setJoinOpen] = useState(false)
  const onlineName = useGame((s) => s.onlineName)

  const wasInRoomRef = useRef(false)
  useEffect(() => {
    if (uid && room.players[uid]) wasInRoomRef.current = true
  }, [uid, room.players])

  useEffect(() => {
    if (!code || !uid || !room.meta) return
    if (room.players[uid]) return
    if (wasInRoomRef.current) {
      navigate('/', { replace: true })
      return
    }
    rejoinIfMissing(code, uid, onlineName).catch(() => {})
  }, [code, uid, room.meta, room.players, onlineName, navigate])

  useEffect(() => {
    if (room.loaded && !room.meta && wasInRoomRef.current) {
      navigate('/', { replace: true })
    }
  }, [room.loaded, room.meta, navigate])

  useEffect(() => {
    if (!isFirebaseConfigured()) return
    ensureSignedIn()
      .then((u) => setUid(u.uid))
      .catch(() => setUid(null))
  }, [])

  if (!isFirebaseConfigured()) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md">
          <ArrowLeft size={16} />
          {t('common.home')}
        </Link>
        <div className="card text-sm">{t('online.fbNotConfigured')}</div>
      </div>
    )
  }

  if (room.loaded && !room.meta) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md">
          <ArrowLeft size={16} />
          {t('common.home')}
        </Link>
        <div className="card text-sm text-rose-300">
          {t('online.errRoomNotFound')}
        </div>
      </div>
    )
  }

  if (!room.meta) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md">
          <ArrowLeft size={16} />
          {t('common.home')}
        </Link>
        <div className="card text-slate-400">
          {t('online.loadingRoom', { code })}
        </div>
      </div>
    )
  }

  if (uid && !room.players[uid] && !onlineName.trim()) {
    return <NamePromptGate code={code!} />
  }

  const playersList = Object.entries(room.players).map(([pid, p]) => ({
    id: pid,
    ...p,
  }))
  const inLobby = room.meta.phase === 'lobby'

  return (
    <div className="space-y-2 sm:space-y-4 flex flex-col flex-1">
      <nav className="flex items-center justify-between text-xs sm:text-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md">
          <ArrowLeft size={16} />
          {t('common.home')}
        </Link>
        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          className="text-accent-400 hover:text-accent-300"
        >
          {t('online.joinAnother')}
        </button>
      </nav>

      <RoomHeader code={code!} compact={!inLobby} />

      {inLobby && (
        <OnlineLobby
          code={code!}
          uid={uid}
          playersList={playersList}
        />
      )}

      {room.meta.phase === 'reveal' && (
        <OnlineReveal
          code={code!}
          word={myPrivate.word}
          isSpy={myPrivate.isSpy}
          fellowSpyNames={myPrivate.fellowSpyNames}
          myName={playersList.find((p) => p.id === uid)?.name ?? 'You'}
        />
      )}

      {room.meta.phase === 'discussion' && (
        <OnlineDiscussion
          code={code!}
          playersList={playersList}
          firstClueGiverId={room.round?.firstClueGiverId ?? null}
        />
      )}

      {room.meta.phase === 'result' && (
        <OnlineResult
          code={code!}
          playersList={playersList}
          pair={pairReveal?.pair ?? null}
          spyUids={
            pairReveal?.spyUids ?? (pairReveal?.spyUid ? [pairReveal.spyUid] : [])
          }
          t={t}
        />
      )}

      <JoinRoomModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title={t('online.joinAnother')}
      />
    </div>
  )
}

function NamePromptGate({ code }: { code: string }) {
  const { t } = useTranslation()
  const setOnlineName = useGame((s) => s.setOnlineName)
  const [draft, setDraft] = useState('')
  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) setOnlineName(trimmed)
  }
  return (
    <div className="space-y-3 sm:space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md">
        <ArrowLeft size={16} />
        {t('common.home')}
      </Link>
      <section className="card space-y-3">
        <div>
          <div className="label">{t('online.yourName')}</div>
          <p className="text-xs text-slate-500 mt-1">
            {t('online.joiningRoomLabel', {
              code,
              defaultValue: `Joining room ${code}`,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            autoFocus
            className="input flex-1"
            value={draft}
            maxLength={20}
            placeholder={t('online.joinNamePlaceholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
            }}
            autoCapitalize="words"
          />
          <button
            type="button"
            onClick={commit}
            disabled={!draft.trim()}
            className="btn-primary px-4 disabled:opacity-40"
          >
            {t('wizard.joinBtn')}
          </button>
        </div>
      </section>
    </div>
  )
}

function RoomHeader({ code, compact }: { code: string; compact?: boolean }) {
  const { t } = useTranslation()
  const joinUrl = `${window.location.origin}${window.location.pathname}#/room/${code}`
  const qrSize = compact ? 72 : 110
  return (
    <section className="card space-y-2 sm:space-y-3">
      <div className="flex items-center gap-3 sm:gap-4">
        <QrCode value={joinUrl} size={qrSize} />
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
          <div className="label">{t('online.share')}</div>
          <div className="font-mono font-bold text-xl sm:text-2xl tracking-widest text-accent-400">
            {code}
          </div>
          <button
            className="btn-ghost px-3 py-1 text-xs"
            onClick={() => navigator.clipboard?.writeText(joinUrl)}
          >
            {t('online.copyLink')}
          </button>
        </div>
      </div>
      {!compact && (
        <div className="text-[11px] sm:text-xs text-slate-500 break-all">
          {joinUrl}
        </div>
      )}
    </section>
  )
}

function OnlineLobby({
  code,
  uid,
  playersList,
}: {
  code: string
  uid: string | null
  playersList: Array<{ id: string; name: string }>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pairSource = useGame((s) => s.settings.pairSource)
  const difficulty = useGame((s) => s.settings.difficulty)
  const spyCount = useGame((s) => s.settings.spyCount)
  const spiesKnowEachOther = useGame((s) => s.settings.spiesKnowEachOther)
  const customLists = useGame((s) => s.customLists)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const me = playersList.find((p) => p.id === uid)

  const startEdit = () => {
    setDraft(me?.name ?? '')
    setEditing(true)
  }
  const commitEdit = async () => {
    const trimmed = draft.trim()
    setEditing(false)
    if (!trimmed || !uid || trimmed === me?.name) return
    try {
      await renamePlayerInRoom(code, uid, trimmed)
      setOnlineName(trimmed)
    } catch {
      /* swallow */
    }
  }

  const onStart = async () => {
    setBusy(true)
    setError(null)
    try {
      const playersMap: Record<string, { name: string; joinedAt: number }> = {}
      for (const p of playersList) {
        playersMap[p.id] = { name: p.name, joinedAt: 0 }
      }
      await startOnlineRound(
        code,
        pairSource,
        customLists,
        playersMap,
        difficulty,
        spyCount,
        spiesKnowEachOther,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errStartRound'))
    } finally {
      setBusy(false)
    }
  }

  const onLeave = async () => {
    if (uid) {
      try {
        await leaveRoom(code, uid)
      } catch {
        /* swallow */
      }
    }
    navigate('/')
  }

  const onKick = async (targetUid: string) => {
    try {
      await kickPlayer(code, targetUid)
    } catch {
      /* swallow */
    }
  }

  return (
    <div className="space-y-2 sm:space-y-4 flex flex-col flex-1">
      <section className="card">
        <div className="label mb-1.5 sm:mb-2">
          {t('online.playersHeader', { count: playersList.length })}
        </div>
        <ul className="space-y-1.5">
          {playersList.map((p) => {
            const isMe = p.id === uid
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 bg-ink-700/40 rounded-lg px-2.5 py-1.5 text-sm"
              >
                {isMe && editing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitEdit()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        setEditing(false)
                      }
                    }}
                    maxLength={20}
                    autoCapitalize="words"
                    className="font-medium text-sm bg-ink-900/60 border border-accent-500/60 rounded px-2 py-0.5 min-w-0 flex-1 focus:outline-none focus:border-accent-400"
                  />
                ) : (
                  <span className="flex-1 min-w-0 truncate">
                    {p.name}
                    {isMe && (
                      <span className="ml-1 text-[10px] text-slate-500">
                        {t('online.youTag')}
                      </span>
                    )}
                  </span>
                )}
                {isMe && !editing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-xs text-accent-400 hover:text-accent-300"
                  >
                    {t('online.renameSelf')}
                  </button>
                )}
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => onKick(p.id)}
                    aria-label="Kick"
                    title="Kick"
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-0.5 leading-none"
                  >
                    ×
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card">
        <PairPicker />
      </section>
      <OptionsPanel playerCount={playersList.length} />
      {error && <div className="text-sm text-rose-400">{error}</div>}
      <div className="action-bar space-y-2">
        <button
          onClick={onStart}
          disabled={
            busy ||
            playersList.length < 3 ||
            pairSource.selectedCategoryIds.length === 0
          }
          className="btn-primary w-full py-3 sm:py-4 text-base sm:text-lg"
        >
          {busy ? t('online.starting') : t('online.startRound')}
        </button>
        {playersList.length < 3 && (
          <p className="text-center text-xs sm:text-sm text-slate-500">
            {t('online.needPlayers')}
          </p>
        )}
        <button
          onClick={onLeave}
          className="btn-ghost w-full py-2 text-xs"
        >
          {t('online.leaveRoom')}
        </button>
      </div>
    </div>
  )
}

function OnlineReveal({
  code,
  word,
  isSpy,
  fellowSpyNames,
  myName,
}: {
  code: string
  word: string | null
  isSpy: boolean
  fellowSpyNames: string[] | null
  myName: string
}) {
  const { t } = useTranslation()
  if (word === null) {
    return (
      <div className="card text-center py-12 text-slate-400">
        {t('online.loadingWord')}
      </div>
    )
  }
  return (
    <div className="space-y-2 sm:space-y-3 flex flex-col flex-1">
      <div
        className="w-full"
        style={{ height: 'min(72vh, calc((100vw - 1.5rem) * 4 / 3))' }}
      >
        <PlayerCard
          playerName={myName}
          word={word}
          isSpy={isSpy}
          persistFlip
          fellowSpyNames={fellowSpyNames ?? undefined}
        />
      </div>
      <div className="action-bar">
        <button
          className="btn-primary w-full py-3 sm:py-4"
          onClick={() => setPhase(code, 'discussion')}
        >
          {t('online.hostAdvance')}
        </button>
      </div>
    </div>
  )
}

function OnlineDiscussion({
  code,
  playersList,
  firstClueGiverId,
}: {
  code: string
  playersList: Array<{ id: string; name: string }>
  firstClueGiverId: string | null
}) {
  const { t } = useTranslation()
  const startIdx = Math.max(
    0,
    playersList.findIndex((p) => p.id === firstClueGiverId),
  )
  return (
    <div className="space-y-2 sm:space-y-5 flex flex-col flex-1">
      <header className="text-center">
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          {t('online.discussTitle')}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">{t('online.discussDesc')}</p>
      </header>

      <section className="card">
        <div className="label mb-1.5 sm:mb-2">{t('online.clueOrder')}</div>
        <div className="font-display text-lg sm:text-xl font-bold text-accent-400 mb-2 sm:mb-3">
          {playersList[startIdx]?.name ?? '—'}
        </div>
        <ol className="text-sm space-y-1 text-slate-300">
          {playersList.map((_, i) => {
            const p = playersList[(startIdx + i) % playersList.length]
            return (
              <li key={p.id} className="flex gap-2">
                <span className="text-slate-500 w-5">{i + 1}.</span>
                <span>{p.name}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="card flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="label">{t('online.discussTimerLabel')}</div>
          <div className="text-[11px] sm:text-xs text-slate-500">
            {t('online.discussTimerHint')}
          </div>
        </div>
        <DiscussionTimer seconds={180} />
      </section>

      <div className="action-bar">
        <button
          className="btn-primary w-full py-3 sm:py-4"
          onClick={() => revealOnline(code)}
        >
          {t('online.hostReveal')}
        </button>
      </div>
    </div>
  )
}

function OnlineResult({
  code,
  playersList,
  pair,
  spyUids,
  t,
}: {
  code: string
  playersList: Array<{ id: string; name: string }>
  pair: { civilian: string; spy: string; categoryId: string } | null
  spyUids: string[]
  t: TFunction
}) {
  const customLists = useGame((s) => s.customLists)
  const spies = spyUids
    .map((uid) => playersList.find((p) => p.id === uid))
    .filter((p): p is { id: string; name: string } => !!p)

  return (
    <div className="space-y-3 sm:space-y-6 flex flex-col flex-1">
      <header className="text-center">
        <div className="text-4xl sm:text-6xl mb-1 sm:mb-2">🕵️</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold">{t('result.title')}</h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">{t('result.subtitle')}</p>
      </header>

      <section className="card text-center space-y-1 sm:space-y-2">
        <div className="label">
          {spies.length > 1 ? t('result.spiesWere') : t('result.spyWas')}
        </div>
        <div className="font-display text-2xl sm:text-3xl font-bold text-rose-300">
          {spies.length > 0 ? spies.map((s) => s.name).join(', ') : '—'}
        </div>
      </section>

      {pair && (
        <section className="card text-center space-y-2 sm:space-y-3">
          <div className="label">{t('result.wordsLabel')}</div>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div>
              <div className="text-[10px] sm:text-xs text-emerald-400 uppercase tracking-wider">
                {t('result.civilians')}
              </div>
              <div className="font-display text-xl sm:text-2xl font-bold">
                {pair.civilian}
              </div>
            </div>
            <div className="text-slate-500">{t('result.vs')}</div>
            <div>
              <div className="text-[10px] sm:text-xs text-rose-400 uppercase tracking-wider">
                {t('result.spy')}
              </div>
              <div className="font-display text-xl sm:text-2xl font-bold">
                {pair.spy || (
                  <span className="italic text-slate-400">
                    {t('result.noHint')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500">
            {t('result.category', {
              name: categoryName(pair.categoryId, customLists, t),
            })}
          </div>
        </section>
      )}

      <div className="action-bar">
        <button
          className="btn-primary w-full py-3 sm:py-4"
          onClick={() => backToLobby(code)}
        >
          {t('online.hostBackLobby')}
        </button>
      </div>
    </div>
  )
}
