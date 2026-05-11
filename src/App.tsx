import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './routes/Home'
import LocalGame from './routes/LocalGame'
import EditList from './routes/EditList'
import OnlineHost from './routes/OnlineHost'
import OnlineJoin from './routes/OnlineJoin'
import OnlineRoom from './routes/OnlineRoom'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-full flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/local" element={<LocalGame />} />
            <Route path="/lists/new" element={<EditList />} />
            <Route path="/lists/:id" element={<EditList />} />
            <Route path="/online" element={<OnlineHost />} />
            <Route path="/join" element={<OnlineJoin />} />
            <Route path="/join/:code" element={<OnlineJoin />} />
            <Route path="/room/:code" element={<OnlineRoom />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="text-center text-xs text-slate-500 py-4">
          Spy — the word game. Play in person or online with friends.
        </footer>
      </div>
    </HashRouter>
  )
}
