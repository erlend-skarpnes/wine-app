import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, Star, GlassWater, User, Wine } from 'lucide-react'
import { useIsFetching } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'

export default function Layout() {
  const { isAuthenticated, loading } = useAuth()
  const { homes, activeHome, setActiveHome } = useHome()
  const isFetching = useIsFetching()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function navTo(path: string) {
    setMenuOpen(false)
    navigate(path)
  }

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

        {isAuthenticated && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Meny"
              className="flex items-center justify-center"
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '4px', width: 28, height: 28 }}
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>

            {menuOpen && (
              <div
                className="absolute top-full right-0 mt-2 bg-surface rounded-xl border border-stone overflow-hidden z-[200]"
                style={{ minWidth: '160px', boxShadow: '0 8px 32px rgba(44,24,16,0.18)' }}
              >
                {[
                  { icon: Wine,       label: 'Kjeller',    path: '/' },
                  { icon: Star,       label: 'Favoritter', path: '/favorites' },
                  { icon: GlassWater, label: 'Historikk',  path: '/history' },
                  { icon: User,       label: 'Profil',     path: '/profile' },
                ].map(({ icon: Icon, label, path }) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => navTo(path)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-bark hover:bg-warm transition-colors"
                    style={{ background: 'transparent', border: 'none', borderRadius: 0, justifyContent: 'flex-start' }}
                  >
                    <Icon size={15} className="text-clay shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
