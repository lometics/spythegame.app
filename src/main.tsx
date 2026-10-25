import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import { i18nReady } from './i18n'
import App from './App.tsx'
import { Analytics } from '@vercel/analytics/react'

// Old builds used hash URLs (#/room/ABCD); keep those links and QR codes working.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

i18nReady.finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>,
  )
})
