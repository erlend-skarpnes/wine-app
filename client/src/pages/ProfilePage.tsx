import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, KeyRound, Plus } from 'lucide-react'
import Modal from '../components/Modal'
import HomeRow from '../components/HomeRow'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { api } from '../api/client'
import { createHome } from '../api/homes'
import { queryKeys } from '../api/queryKeys'

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

// --- Home section ---

function HomeSection() {
  const { homes } = useHome()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createHome(newName),
    onSuccess: () => {
      setNewName('')
      queryClient.invalidateQueries({ queryKey: queryKeys.homes() })
    },
  })

  return (
    <section className="flex flex-col gap-3">
      <p className="text-[0.65rem] font-semibold text-clay uppercase tracking-widest">Mine hjem</p>

      <div className="bg-surface rounded-2xl border border-stone px-4">
        {homes.map(h => (
          <HomeRow key={h.id} home={h} onChanged={() => queryClient.invalidateQueries({ queryKey: queryKeys.homes() })} />
        ))}
      </div>

      <form
        onSubmit={e => { e.preventDefault(); if (newName.trim()) createMutation.mutate() }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Opprett nytt hjem…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 border border-stone rounded-lg px-4 py-2.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
        />
        <button type="submit" disabled={createMutation.isPending || !newName.trim()} className="flex items-center gap-1.5 px-4">
          <Plus size={14} />
          {createMutation.isPending ? 'Oppretter…' : 'Opprett'}
        </button>
      </form>
      {createMutation.isError && <p className="text-red-600 text-xs">Kunne ikke opprette hjem.</p>}
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
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">

        {/* Membership card */}
        <section
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: 'linear-gradient(108deg, #5a1c23 0%, #722F37 55%, #7a3540 100%)' }}
        >
          <div>
            <p className="text-white/40 text-[0.62rem] uppercase tracking-widest mb-2">Min profil</p>
            <h2
              className="text-white leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '2.1rem', fontStyle: 'italic', fontWeight: 400 }}
            >
              {username}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin
              ? <Link to="/admin" className="no-underline text-[0.72rem] font-medium rounded-full px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}>
                  Admin
                </Link>
              : <span className="text-white/40 text-[0.72rem]">Bruker</span>
            }
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setChangingPassword(true)}
              className="flex items-center gap-1.5 text-[0.75rem] rounded-full px-3 py-1.5"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'white' }}
            >
              <KeyRound size={12} /> Bytt passord
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[0.75rem] rounded-full px-3 py-1.5"
              style={{ background: 'rgba(255,70,50,0.12)', border: '1px solid rgba(255,100,80,0.25)', color: 'rgba(255,190,170,1)' }}
            >
              <LogOut size={12} /> Logg ut
            </button>
          </div>
        </section>

        {/* Homes */}
        <HomeSection />
      </div>

      {/* Footer: build info + update */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-[0.68rem] text-clay/60">
          Bygd {new Date(__BUILD_TIME__).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
        <button
          onClick={handleForceRefresh}
          disabled={refreshing}
          className="secondary text-[0.72rem] px-3 py-1.5 flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Oppdaterer…' : 'Se etter ny versjon'}
        </button>
      </div>

      {changingPassword && <PasswordModal onClose={() => setChangingPassword(false)} />}
    </div>
  )
}
