import { Link } from 'react-router-dom'
import InstallPrompt from '../components/InstallPrompt'

export default function Home() {
  return (
    <div className="space-y-6">
      <header className="text-center pt-6 sm:pt-12">
        <div className="inline-block text-5xl mb-3">🕵️</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
          Spy
        </h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          Everyone gets a word. One player gets a{' '}
          <span className="text-accent-400 font-semibold">similar word</span>.
          Find the spy before they blend in.
        </p>
      </header>

      <section className="grid gap-3">
        <Link to="/local" className="card hover:bg-ink-700/60 transition block">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Pass-and-play</div>
              <div className="text-sm text-slate-400">
                One phone, friends in the same room. No setup.
              </div>
            </div>
            <div className="text-3xl">📱</div>
          </div>
        </Link>

        <Link
          to="/online"
          className="card hover:bg-ink-700/60 transition block"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Host an online room</div>
              <div className="text-sm text-slate-400">
                Each friend joins from their own phone with a code.
              </div>
            </div>
            <div className="text-3xl">🌐</div>
          </div>
        </Link>

        <Link to="/join" className="card hover:bg-ink-700/60 transition block">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Join a room</div>
              <div className="text-sm text-slate-400">
                Got a code from your host? Jump in.
              </div>
            </div>
            <div className="text-3xl">🔑</div>
          </div>
        </Link>
      </section>

      <InstallPrompt />

      <details className="card text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-slate-200">
          How to play
        </summary>
        <ol className="mt-3 space-y-2 list-decimal pl-5">
          <li>
            Everyone gets a word. One secret <em>spy</em> gets a{' '}
            <em>similar</em> word.
          </li>
          <li>
            Go around the table. Each player says one short clue about their
            word.
          </li>
          <li>
            Discuss. Then vote. If you eliminate the spy, civilians win. If
            not, the spy wins.
          </li>
        </ol>
      </details>
    </div>
  )
}
