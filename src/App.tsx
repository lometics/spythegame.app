import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './routes/Home'
import LocalGame from './routes/LocalGame'
import EditList from './routes/EditList'
import OnlineRoom from './routes/OnlineRoom'
import Options from './routes/Options'
import LanguageSwitcher from './components/LanguageSwitcher'
import { useGame } from './game/state'
import { randomSpyName } from './data/spyNames'

function JoinRedirect() {
  const { code } = useParams()
  return <Navigate to={`/room/${(code ?? '').toUpperCase()}`} replace />
}

export default function App() {
  const { t } = useTranslation()
  useEffect(() => {
    const { onlineName, setOnlineName } = useGame.getState()
    if (!onlineName.trim()) setOnlineName(randomSpyName())
  }, [])
  return (
    <HashRouter>
      <div className="min-h-full flex flex-col">
        <main className="flex-1 flex flex-col mx-auto w-full max-w-2xl px-3 sm:px-4 py-3 sm:py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/local" element={<LocalGame />} />
            <Route path="/lists/new" element={<EditList />} />
            <Route path="/lists/:id" element={<EditList />} />
            <Route path="/options" element={<Options />} />
            <Route path="/room/:code" element={<OnlineRoom />} />
            <Route path="/join/:code" element={<JoinRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="mx-auto w-full max-w-2xl px-3 sm:px-4 pb-2 sm:pb-4 flex flex-col items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
          <LanguageSwitcher />
          <div className="text-center">{t('app.footer')}</div>
        </footer>
      </div>
    </HashRouter>
  )
}
