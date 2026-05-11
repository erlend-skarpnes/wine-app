import { Outlet, Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'

export default function Layout() {
  const { isAuthenticated, loading } = useAuth()
  const { homes, activeHome, setActiveHome } = useHome()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="bg-wine text-white px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="text-[1.1rem] font-bold tracking-[0.02em] text-white no-underline shrink-0">{__APP_NAME__}</Link>
          {isAuthenticated && homes.length > 1 && activeHome && (
            <select
              value={activeHome.id}
              onChange={e => {
                const home = homes.find(h => h.id === parseInt(e.target.value, 10))
                if (home) setActiveHome(home)
              }}
              className="text-sm bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/50 min-w-0 max-w-[160px]"
            >
              {homes.map(h => (
                <option key={h.id} value={h.id} className="text-bark bg-surface">{h.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <Link to="/profile" className="text-white/70 hover:text-white no-underline" aria-label="Min profil">
              <User size={18} />
            </Link>
          )}
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto p-6 max-w-[960px] mx-auto w-full"
        style={{ paddingBottom: 'max(calc(1.5rem + 72px), var(--keyboard-height, 0px))' }}
      >
        <Outlet />
      </main>
    </div>
  )
}
