import { Outlet, Link } from 'react-router-dom'
import { User, ChevronDown } from 'lucide-react'
import { useIsFetching } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'

export default function Layout() {
  const { isAuthenticated, loading } = useAuth()
  const { homes, activeHome, setActiveHome } = useHome()
  const isFetching = useIsFetching()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header
        className="text-white px-6 py-3 flex items-center justify-between gap-4 shrink-0"
        style={{
          background: 'linear-gradient(108deg, #5a1c23 0%, #722F37 55%, #7a3540 100%)',
          boxShadow: '0 2px 10px rgba(44,24,16,0.4)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="text-white no-underline shrink-0 leading-none"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.02em' }}
          >
            {__APP_NAME__}
          </Link>

          {isAuthenticated && homes.length > 1 && activeHome && (
            <div className="relative min-w-0">
              <select
                value={activeHome.id}
                onChange={e => {
                  const home = homes.find(h => h.id === parseInt(e.target.value, 10))
                  if (home) setActiveHome(home)
                }}
                className="appearance-none text-[0.78rem] bg-white/10 text-white border border-white/20 rounded-full pl-3 pr-7 py-1 focus:outline-none focus:border-white/40 min-w-0 max-w-[150px] cursor-pointer"
              >
                {homes.map(h => (
                  <option key={h.id} value={h.id} className="text-bark bg-surface">{h.name}</option>
                ))}
              </select>
              <ChevronDown size={11} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex items-center">
          {isAuthenticated && (
            <Link to="/profile" className="text-white/55 hover:text-white no-underline transition-colors" aria-label="Min profil">
              <User size={17} />
            </Link>
          )}
        </div>
      </header>

      <div className="h-[2px] shrink-0 overflow-hidden" style={{ background: isFetching ? 'rgba(114,47,55,0.12)' : 'transparent' }}>
        {isFetching > 0 && (
          <div
            className="h-full bg-wine w-[40%]"
            style={{ animation: 'progressSweep 1s cubic-bezier(0.4,0,0.2,1) infinite' }}
          />
        )}
      </div>

      <main
        className="flex-1 overflow-y-auto p-6 max-w-[960px] mx-auto w-full"
        style={{ paddingBottom: 'max(calc(1.5rem + 72px), var(--keyboard-height, 0px))' }}
      >
        <Outlet />
      </main>
    </div>
  )
}
