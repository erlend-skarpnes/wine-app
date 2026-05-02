import { createBrowserRouter, RouterProvider, Outlet, Navigate, useParams, useNavigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CellarProvider } from './context/CellarContext'
import CellarPage from './pages/CellarPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import JoinCellarPage from './pages/JoinCellarPage'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

function Layout() {
  const { isAuthenticated, isAdmin, username, loading, logout } = useAuth()

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
          {isAuthenticated && isAdmin && (
            <Link to="/admin" className="text-xs text-white/70 hover:text-white no-underline">Admin</Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs opacity-50">{new Date(__BUILD_TIME__).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}</span>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="text-xs text-white/70 hover:text-white no-underline">
                {username}
              </Link>
              <button
                onClick={logout}
                className="bg-transparent border border-white/40 text-white text-xs px-3 py-1 rounded-lg hover:bg-white/10"
              >
                Logg ut
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+72px)] max-w-[960px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { login } = useAuth()
  const navigate = useNavigate()
  return (
    <RegisterForm
      inviteToken={token!}
      onRegister={name => { login(name, false); navigate('/', { replace: true }) }}
    />
  )
}

function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <LoginForm onLogin={login} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RequireAuth><CellarPage /></RequireAuth> },
      { path: 'admin', element: <RequireAdmin><AdminPage /></RequireAdmin> },
      { path: 'profile', element: <RequireAuth><ProfilePage /></RequireAuth> },
      { path: 'cellars/join/:token', element: <RequireAuth><JoinCellarPage /></RequireAuth> },
      { path: 'invite/:token', element: <InvitePage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <CellarProvider>
        <RouterProvider router={router} />
      </CellarProvider>
    </AuthProvider>
  )
}
