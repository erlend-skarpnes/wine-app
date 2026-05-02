import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, KeyRound } from 'lucide-react'
import Modal from '../components/Modal'
import CellarRow from '../components/CellarRow'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useCellar } from '../context/CellarContext'
import { api } from '../api/client'
import { createCellar } from '../api/cellars'

// --- Password modal ---

function PasswordModal({ onClose }: { onClose: () => void }) {
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
      setTimeout(() => { setSuccess(false); onClose() }, 1500)
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

  const error = validationError ?? (mutation.isError ? extractPasswordError(mutation.error) : null)

  return (
    <Modal title="Bytt passord" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="password" placeholder="Nåværende passord" autoComplete="current-password"
          value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
          className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine" required />
        <input type="password" placeholder="Nytt passord" autoComplete="new-password"
          value={newPassword} onChange={e => setNewPassword(e.target.value)}
          className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine" required />
        <input type="password" placeholder="Bekreft nytt passord" autoComplete="new-password"
          value={confirm} onChange={e => setConfirm(e.target.value)}
          className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine" required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-700 text-sm">Passord oppdatert.</p>}
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Lagrer…' : 'Lagre'}
        </button>
      </form>
    </Modal>
  )
}

function extractPasswordError(err: unknown): string {
  if (!(err instanceof Error)) return 'Noe gikk galt.'
  if (err.message.includes('401')) return 'Nåværende passord er feil.'
  return 'Noe gikk galt. Prøv igjen.'
}

// --- Cellar section ---

function CellarSection() {
  const { cellars } = useCellar()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createCellar(newName),
    onSuccess: () => {
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['cellars'] })
    },
  })

  return (
    <section>
      <h2 className="text-lg font-semibold text-bark mb-4">Vinkjellere</h2>
      <div className="space-y-3">
        {cellars.map(c => <CellarRow key={c.id} cellar={c} />)}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Navn på ny kjeller"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
        />
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !newName.trim()}
        >
          {createMutation.isPending ? 'Oppretter…' : 'Opprett'}
        </button>
      </div>
      {createMutation.isError && <p className="text-red-600 text-xs mt-1">Kunne ikke opprette kjeller.</p>}
    </section>
  )
}

// --- Main page ---

export default function ProfilePage() {
  const { username, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function handleForceRefresh() {
    setRefreshing(true)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) await reg.update()
    }
    window.location.reload()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-clay">
          Bygd {new Date(__BUILD_TIME__).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
        <button
          onClick={handleForceRefresh}
          disabled={refreshing}
          className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw size={14} /> {refreshing ? 'Oppdaterer…' : 'Se etter ny versjon'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
        {/* Left column: profile info */}
        <div className="space-y-8">
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
                  ? <Link to="/admin" className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full font-medium no-underline">Admin</Link>
                  : <span className="text-clay text-xs">Bruker</span>
                }
              </div>
              <div className="pt-1 flex gap-2 flex-wrap">
                <button
                  onClick={() => setChangingPassword(true)}
                  className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <KeyRound size={14} /> Bytt passord
                </button>
                <button
                  onClick={handleLogout}
                  className="secondary text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
                >
                  <LogOut size={14} /> Logg ut
                </button>
              </div>
            </div>
          </section>

          {changingPassword && <PasswordModal onClose={() => setChangingPassword(false)} />}
        </div>

        {/* Right column: cellars */}
        <div>
          <CellarSection />
        </div>
      </div>
    </div>
  )
}
