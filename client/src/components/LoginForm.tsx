import { useState } from 'react'
import { login } from '../api/auth'

interface Props {
  onLogin: (username: string, isAdmin: boolean) => void
}

export default function LoginForm({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { username: name, isAdmin } = await login(username, password)
      onLogin(name, isAdmin)
    } catch {
      setError('Feil brukernavn eller passord.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-xl font-semibold text-bark">Vinkjelleren</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          type="text"
          placeholder="Brukernavn"
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
          required
        />
        <input
          type="password"
          placeholder="Passord"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="py-3">
          {loading ? 'Logger inn…' : 'Logg inn'}
        </button>
      </form>
    </div>
  )
}
