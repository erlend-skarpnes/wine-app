import { createContext, useContext, useEffect, useState } from 'react'
import { me, logout as apiLogout } from '../api/auth'
import { setUnauthenticatedHandler } from '../api/client'

interface AuthState {
  isAuthenticated: boolean
  username: string | null
  isAdmin: boolean
  loading: boolean
  login: (username: string, isAdmin: boolean) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  function login(name: string, admin: boolean) {
    setIsAuthenticated(true)
    setUsername(name)
    setIsAdmin(admin)
  }

  async function logout() {
    await apiLogout()
    setIsAuthenticated(false)
    setUsername(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
