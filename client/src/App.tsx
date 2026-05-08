import { createBrowserRouter, RouterProvider, Navigate, useParams, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HomeProvider } from './context/HomeContext'
import Layout from './components/Layout'
import CellarPage from './pages/CellarPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import JoinHomePage from './pages/JoinHomePage'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

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
      { path: 'homes/join/:token', element: <RequireAuth><JoinHomePage /></RequireAuth> },
      { path: 'invite/:token', element: <InvitePage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <HomeProvider>
        <RouterProvider router={router} />
      </HomeProvider>
    </AuthProvider>
  )
}
