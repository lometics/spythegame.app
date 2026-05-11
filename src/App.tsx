import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './routes/Home'
import LocalGame from './routes/LocalGame'
import EditList from './routes/EditList'
import OnlineHost from './routes/OnlineHost'
import OnlineJoin from './routes/OnlineJoin'
import OnlineRoom from './routes/OnlineRoom'
import RendezvousJoin from './routes/RendezvousJoin'
import LanguageSwitcher from './components/LanguageSwitcher'

export default function App() {
  const { t } = useTranslation()
  return (
    <HashRouter>
      <div className="min-h-full flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-2xl px-3 sm:px-4 py-3 sm:py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/local" element={<LocalGame />} />
            <Route path="/lists/new" element={<EditList />} />
            <Route path="/lists/:id" element={<EditList />} />
            <Route path="/online" element={<OnlineHost />} />
            <Route path="/join" element={<OnlineJoin />} />
            <Route path="/join/:code" element={<OnlineJoin />} />
            <Route path="/room/:code" element={<OnlineRoom />} />
            <Route path="/rdv/:uid" element={<RendezvousJoin />} />
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
