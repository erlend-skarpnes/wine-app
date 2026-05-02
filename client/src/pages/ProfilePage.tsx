import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function ProfilePage() {
  const { username, isAdmin } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    setSuccess(false)
    if (newPassword !== confirm) {
      setValidationError('Passordene stemmer ikke overens.')
      return
    }
    mutation.mutate()
  }

  const error = validationError ?? (mutation.isError ? extractError(mutation.error) : null)

  return (
    <div className="max-w-sm space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-bark mb-4">Profil</h2>
        <div className="bg-surface rounded-xl border border-stone p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-clay">Brukernavn</span>
            <span className="font-medium">{username}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-clay">Rolle</span>
            {isAdmin
              ? <span className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full font-medium">Admin</span>
              : <span className="text-clay text-xs">Bruker</span>
            }
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-bark mb-4">Bytt passord</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Nåværende passord"
            autoComplete="current-password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
            required
          />
          <input
            type="password"
            placeholder="Nytt passord"
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
            required
          />
          <input
            type="password"
            placeholder="Bekreft nytt passord"
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-700 text-sm">Passord oppdatert.</p>}
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Lagrer…' : 'Lagre'}
          </button>
        </form>
      </section>
    </div>
  )
}

function extractError(err: unknown): string {
  if (!(err instanceof Error)) return 'Noe gikk galt.'
  if (err.message.includes('401')) return 'Nåværende passord er feil.'
  return 'Noe gikk galt. Prøv igjen.'
}
