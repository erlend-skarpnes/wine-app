import { useState } from 'react'
import { register } from '../api/auth'

interface Props {
  inviteToken: string
  onRegister: (username: string) => void
}

export default function RegisterForm({ inviteToken, onRegister }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passordene stemmer ikke overens.')
      return
    }

    setLoading(true)
    try {
      const { username: name } = await register(inviteToken, username, password)
      // Remove invite token from URL without reloading
      window.history.replaceState(null, '', '/')
      onRegister(name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('409') || msg.includes('Conflict')) {
        setError('Brukernavnet er allerede i bruk.')
      } else if (msg.includes('400')) {
        setError('Invitasjonen er ugyldig eller utløpt.')
      } else {
        setError('Noe gikk galt. Prøv igjen.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-bark">Opprett bruker</h2>
        <p className="text-clay text-sm mt-1">Du er invitert til Vinkjelleren.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          type="text"
          placeholder="Velg brukernavn"
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
          required
        />
        <input
          type="password"
          placeholder="Velg passord"
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
          required
        />
        <input
          type="password"
          placeholder="Bekreft passord"
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="py-3">
          {loading ? 'Oppretter bruker…' : 'Opprett bruker'}
        </button>
      </form>
    </div>
  )
}
