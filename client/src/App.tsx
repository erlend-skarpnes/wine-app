import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import CellarPage from './pages/CellarPage'
import { setTokenGetter } from './api/client'

export default function App() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    setTokenGetter(getAccessTokenSilently)
  }, [getAccessTokenSilently])

  if (isLoading) {
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
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="bg-transparent border border-white/40 text-white text-xs px-3 py-1 rounded-lg hover:bg-white/10"
            >
              Logg ut
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+72px)] max-w-[960px] mx-auto w-full">
        {isAuthenticated ? (
          <CellarPage />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <p className="text-clay">Logg inn for å se kjelleren din.</p>
            <button onClick={() => loginWithRedirect()}>Logg inn</button>
          </div>
        )}
      </main>
    </div>
  )
}
