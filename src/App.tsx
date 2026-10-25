import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Home from './routes/Home'
import LocalSetup from './routes/LocalSetup'
import LocalGame from './routes/LocalGame'
import {
  HintPage,
  PlayersPage,
  SpiesPage,
  TimerPage,
  WordsPage,
} from './routes/SetupPages'
import BackHandler from './components/BackHandler'
import { useGame } from './game/state'
import { randomSpyName } from './data/spyNames'

// Online play pulls in Firebase and the QR libraries; keep them out of the first load.
const Online = lazy(() => import('./routes/Online'))
const OnlineRoom = lazy(() => import('./routes/OnlineRoom'))
const EditList = lazy(() => import('./routes/EditList'))
const Options = lazy(() => import('./routes/Options'))

function JoinRedirect() {
  const { code } = useParams()
  return <Navigate to={`/room/${(code ?? '').toUpperCase()}`} replace />
}

export default function App() {
  useEffect(() => {
    const { onlineName, setOnlineName } = useGame.getState()
    if (!onlineName.trim()) setOnlineName(randomSpyName())
  }, [])
  return (
    <BrowserRouter>
      <BackHandler />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
        <Suspense fallback={null}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/local" element={<LocalSetup />} />
            <Route path="/local/play" element={<LocalGame />} />
            <Route path="/setup/players" element={<PlayersPage />} />
            <Route path="/setup/words" element={<WordsPage />} />
            <Route path="/setup/spies" element={<SpiesPage />} />
            <Route path="/setup/hint" element={<HintPage />} />
            <Route path="/setup/timer" element={<TimerPage />} />
            <Route path="/lists/new" element={<EditList />} />
            <Route path="/lists/:id" element={<EditList />} />
            <Route path="/options" element={<Options />} />
            <Route path="/online" element={<Online />} />
            <Route path="/room/:code" element={<OnlineRoom />} />
            <Route path="/join/:code" element={<JoinRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  )
}
