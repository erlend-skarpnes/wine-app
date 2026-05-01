import { useEffect, useState } from 'react'
import CellarPage from './pages/CellarPage'
import LoginForm from './components/LoginForm'
import { me, logout } from './api/auth'
import { setUnauthenticatedHandler } from './api/client'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    me()
      .then(({ username: name }) => { setIsAuthenticated(true); setUsername(name) })
      .catch(() => {})
      .finally(() => setLoading(false))

    setUnauthenticatedHandler(() => { setIsAuthenticated(false); setUsername(null) })
  }, [])

  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUsername(null)
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
      <header className="bg-wine text-white px-6 py-3.5 flex items-center justify-between gap-8 flex-wrap shrink-0">
        <span className="text-[1.1rem] font-bold tracking-[0.02em]">{__APP_NAME__}</span>
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
        {isAuthenticated
          ? <CellarPage />
          : <LoginForm onLogin={name => { setIsAuthenticated(true); setUsername(name) }} />
        }
      </main>
    </div>
  )
}
