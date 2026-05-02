import { useEffect, useState } from 'react'
import CellarPage from './pages/CellarPage'
import AdminPage from './pages/AdminPage'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import { me, logout } from './api/auth'
import { setUnauthenticatedHandler } from './api/client'

function getInviteToken(): string | null {
  const match = window.location.pathname.match(/^\/invite\/([a-fA-F0-9]+)$/)
  return match ? match[1] : null
}

function isAdminPath(): boolean {
  return window.location.pathname === '/admin'
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    me()
      .then(({ username: name, isAdmin: admin }) => {
        setIsAuthenticated(true)
        setUsername(name)
        setIsAdmin(admin)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    setUnauthenticatedHandler(() => {
      setIsAuthenticated(false)
      setUsername(null)
      setIsAdmin(false)
    })
  }, [])

  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUsername(null)
    setIsAdmin(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  function renderMain() {
    if (!isAuthenticated) {
      if (getInviteToken()) {
        return (
          <RegisterForm
            inviteToken={getInviteToken()!}
            onRegister={name => { setIsAuthenticated(true); setUsername(name) }}
          />
        )
      }
      return <LoginForm onLogin={(name, admin) => { setIsAuthenticated(true); setUsername(name); setIsAdmin(admin) }} />
    }
    if (isAdmin && isAdminPath()) return <AdminPage />
    return <CellarPage />
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="bg-wine text-white px-6 py-3.5 flex items-center justify-between gap-8 flex-wrap shrink-0">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[1.1rem] font-bold tracking-[0.02em] text-white no-underline">{__APP_NAME__}</a>
          {isAuthenticated && isAdmin && (
            <a href="/admin" className="text-xs text-white/70 hover:text-white no-underline">Admin</a>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs opacity-50">{new Date(__BUILD_TIME__).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}</span>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="bg-transparent border border-white/40 text-white text-xs px-3 py-1 rounded-lg hover:bg-white/10"
            >
              {username ? `Logg ut (${username})` : 'Logg ut'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+72px)] max-w-[960px] mx-auto w-full">
        {renderMain()}
      </main>
    </div>
  )
}
