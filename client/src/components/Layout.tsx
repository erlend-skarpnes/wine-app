import { Outlet, Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { isAuthenticated, loading } = useAuth()

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
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[1.1rem] font-bold tracking-[0.02em] text-white no-underline">{__APP_NAME__}</Link>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <Link to="/profile" className="text-xs text-white/70 hover:text-white no-underline flex items-center gap-1.5">
              <User size={14} />
              Min profil
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+72px)] max-w-[960px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
