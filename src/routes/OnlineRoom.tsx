import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  backToLobby,
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
import { useGame } from '../game/state'

export default function OnlineRoom() {
  const { code } = useParams()
  const [uid, setUid] = useState<string | null>(null)
  const room = useRoom(code)
  const myPrivate = useMyPrivate(code, uid ?? undefined)
  const pairReveal = usePairReveal(code)

  useEffect(() => {
    if (!isFirebaseConfigured()) return
    ensureSignedIn()
      .then((u) => setUid(u.uid))
      .catch(() => setUid(null))
  }, [])

  if (!isFirebaseConfigured()) {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-slate-400">
          ← Home
        </Link>
        <div className="card text-sm">Firebase isn't configured.</div>
      </div>
    )
  }

  if (!room.meta) {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-slate-400">
          ← Home
        </Link>
        <div className="card text-slate-400">Loading room {code}…</div>
      </div>
    )
  }

  const isHost = uid === room.meta.hostUid
  const playersList = Object.entries(room.players).map(([pid, p]) => ({
    id: pid,
    ...p,
  }))

  return (
    <div className="space-y-4">
      <nav className="flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-400 hover:text-slate-200">
          ← Home
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Room</span>
          <span className="font-mono font-bold text-accent-400 tracking-widest">
            {code}
          </span>
        </div>
      </nav>

      {room.meta.phase === 'lobby' && (
        <OnlineLobby
          code={code!}
          isHost={isHost}
          playersList={playersList}
        />
      )}

      {room.meta.phase === 'reveal' && (
        <OnlineReveal
          code={code!}
          isHost={isHost}
          word={myPrivate.word}
          isSpy={myPrivate.isSpy}
          myName={playersList.find((p) => p.id === uid)?.name ?? 'You'}
        />
      )}

      {room.meta.phase === 'discussion' && (
        <OnlineDiscussion
          code={code!}
          isHost={isHost}
          playersList={playersList}
          firstClueGiverId={room.round?.firstClueGiverId ?? null}
        />
      )}

      {room.meta.phase === 'result' && (
        <OnlineResult
          code={code!}
          isHost={isHost}
          playersList={playersList}
          pair={pairReveal?.pair ?? null}
          spyUid={pairReveal?.spyUid ?? null}
        />
      )}
    </div>
  )
}

function OnlineLobby({
  code,
  isHost,
  playersList,
}: {
  code: string
  isHost: boolean
  playersList: Array<{ id: string; name: string }>
}) {
  const pairSource = useGame((s) => s.settings.pairSource)
  const customLists = useGame((s) => s.customLists)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onStart = async () => {
    setBusy(true)
    setError(null)
    try {
      const playersMap: Record<string, { name: string; joinedAt: number }> = {}
      for (const p of playersList) {
        playersMap[p.id] = { name: p.name, joinedAt: 0 }
      }
      await startOnlineRound(code, pairSource, customLists, playersMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start round')
    } finally {
      setBusy(false)
    }
  }

  const joinUrl = `${window.location.origin}${window.location.pathname}#/join/${code}`

  return (
    <div className="space-y-4">
      <section className="card space-y-2">
        <div className="label">Share this room</div>
        <div className="flex items-center gap-3">
          <div className="font-mono font-bold text-2xl tracking-widest text-accent-400">
            {code}
          </div>
          <button
            className="btn-ghost px-3 py-1.5 text-sm"
            onClick={() => navigator.clipboard?.writeText(joinUrl)}
          >
            Copy link
          </button>
        </div>
        <div className="text-xs text-slate-500 break-all">{joinUrl}</div>
      </section>

      <section className="card">
        <div className="label mb-2">Players ({playersList.length})</div>
        <ul className="space-y-2">
          {playersList.map((p) => (
            <li
              key={p.id}
              className="bg-ink-700/40 rounded-xl px-3 py-2 text-sm"
            >
              {p.name}
            </li>
          ))}
        </ul>
      </section>

      {isHost ? (
        <>
          <section className="card">
            <PairPicker />
          </section>
          {error && <div className="text-sm text-rose-400">{error}</div>}
          <button
            onClick={onStart}
            disabled={
              busy ||
              playersList.length < 3 ||
              pairSource.selectedCategoryIds.length === 0
            }
            className="btn-primary w-full py-4 text-lg"
          >
            {busy ? 'Starting…' : 'Start round →'}
          </button>
          {playersList.length < 3 && (
            <p className="text-center text-sm text-slate-500">
              Need at least 3 players. Share the link!
            </p>
          )}
        </>
      ) : (
        <div className="card text-center text-slate-400 text-sm">
          Waiting for the host to start the round…
        </div>
      )}
    </div>
  )
}

function OnlineReveal({
  code,
  isHost,
  word,
  isSpy,
  myName,
}: {
  code: string
  isHost: boolean
  word: string | null
  isSpy: boolean
  myName: string
}) {
  if (!word) {
    return (
      <div className="card text-center py-12 text-slate-400">
        Loading your word…
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <PlayerCard
        playerName={myName}
        word={word}
        isSpy={isSpy}
        persistFlip
      />
      {isHost ? (
        <button
          className="btn-primary w-full"
          onClick={() => setPhase(code, 'discussion')}
        >
          Everyone seen their word? → Discuss
        </button>
      ) : (
        <p className="text-center text-xs text-slate-500">
          When everyone's ready, your host will advance to discussion.
        </p>
      )}
    </div>
  )
}

function OnlineDiscussion({
  code,
  isHost,
  playersList,
  firstClueGiverId,
}: {
  code: string
  isHost: boolean
  playersList: Array<{ id: string; name: string }>
  firstClueGiverId: string | null
}) {
  const startIdx = Math.max(
    0,
    playersList.findIndex((p) => p.id === firstClueGiverId),
  )
  return (
    <div className="space-y-5">
      <header className="text-center">
        <h2 className="font-display text-2xl font-bold">Discuss</h2>
        <p className="text-slate-400 text-sm">
          Each player says one short clue about their word, then debate it out
          in person. Decide together who you think is the spy.
        </p>
      </header>

      <section className="card">
        <div className="label mb-2">Clue order — starts with</div>
        <div className="font-display text-xl font-bold text-accent-400 mb-3">
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

      <section className="card flex items-center justify-between">
        <div>
          <div className="label">Discussion timer</div>
          <div className="text-xs text-slate-500">3 minutes by default.</div>
        </div>
        <DiscussionTimer seconds={180} />
      </section>

      {isHost ? (
        <button
          className="btn-primary w-full py-4"
          onClick={() => revealOnline(code)}
        >
          Reveal the spy →
        </button>
      ) : (
        <div className="card text-center text-slate-400 text-sm">
          Host will reveal the spy when everyone's ready.
        </div>
      )}
    </div>
  )
}

function OnlineResult({
  code,
  isHost,
  playersList,
  pair,
  spyUid,
}: {
  code: string
  isHost: boolean
  playersList: Array<{ id: string; name: string }>
  pair: { civilian: string; spy: string; categoryId: string } | null
  spyUid: string | null
}) {
  const spy = playersList.find((p) => p.id === spyUid)

  return (
    <div className="space-y-6">
      <header className="text-center">
        <div className="text-6xl mb-2">🕵️</div>
        <h2 className="font-display text-3xl font-bold">The reveal</h2>
        <p className="text-slate-400 text-sm mt-1">Did you guess right?</p>
      </header>

      <section className="card text-center space-y-2">
        <div className="label">The spy was</div>
        <div className="font-display text-3xl font-bold text-rose-300">
          {spy?.name ?? '—'}
        </div>
      </section>

      {pair && (
        <section className="card text-center space-y-3">
          <div className="label">The words</div>
          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="text-xs text-emerald-400 uppercase tracking-wider">
                Civilians
              </div>
              <div className="font-display text-2xl font-bold">
                {pair.civilian}
              </div>
            </div>
            <div className="text-slate-500">vs</div>
            <div>
              <div className="text-xs text-rose-400 uppercase tracking-wider">
                Spy
              </div>
              <div className="font-display text-2xl font-bold">{pair.spy}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Category: {pair.categoryId}
          </div>
        </section>
      )}

      {isHost ? (
        <button
          className="btn-primary w-full py-4"
          onClick={() => backToLobby(code)}
        >
          Back to lobby
        </button>
      ) : (
        <div className="card text-center text-sm text-slate-400">
          Host can take everyone back to the lobby.
        </div>
      )}
    </div>
  )
}
