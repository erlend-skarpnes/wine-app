import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Copy, Share2, Trash2, Pencil, RefreshCw } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useCellar } from '../context/CellarContext'
import { api } from '../api/client'
import {
  createCellar, renameCellar, deleteCellar,
  generateShareLink, removeMember, getCellarMembers,
} from '../api/cellars'
import type { CellarMember, CellarSummary } from '../api/types'

// --- Password section ---

function PasswordSection() {
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

  const error = validationError ?? (mutation.isError ? extractPasswordError(mutation.error) : null)

  return (
    <section>
      <h2 className="text-lg font-semibold text-bark mb-4">Bytt passord</h2>
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
    </section>
  )
}

function extractPasswordError(err: unknown): string {
  if (!(err instanceof Error)) return 'Noe gikk galt.'
  if (err.message.includes('401')) return 'Nåværende passord er feil.'
  return 'Noe gikk galt. Prøv igjen.'
}

// --- Cellar member list (lazy) ---

function CellarMemberList({ cellarId }: { cellarId: number }) {
  const { data: members, isLoading } = useQuery<CellarMember[]>({
    queryKey: ['cellar-members', cellarId],
    queryFn: () => getCellarMembers(cellarId),
  })

  if (isLoading) return <p className="text-clay text-xs mt-2">Laster…</p>

  return (
    <ul className="mt-2 space-y-1">
      {members?.map(m => (
        <li key={m.userId} className="flex items-center gap-2 text-sm">
          <span>{m.username}</span>
          {m.role === 'owner' && (
            <span className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full">Eier</span>
          )}
        </li>
      ))}
    </ul>
  )
}

// --- Single cellar row ---

function CellarRow({ cellar }: { cellar: CellarSummary }) {
  const { username } = useAuth()
  const { setActiveCellar } = useCellar()
  const queryClient = useQueryClient()

  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(cellar.name)
  const [expanded, setExpanded] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['cellars'] })
  }

  const renameMutation = useMutation({
    mutationFn: () => renameCellar(cellar.id, renameValue),
    onSuccess: () => { setRenaming(false); invalidate() },
    onError: () => setError('Kunne ikke endre navn.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCellar(cellar.id),
    onSuccess: invalidate,
    onError: (err) => {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('409') || msg.includes('Conflict')) {
        setError(
          msg.includes('flasker')
            ? 'Kjelleren inneholder fremdeles flasker. Tøm den før du sletter.'
            : 'Du kan ikke slette din siste kjeller.'
        )
      } else {
        setError('Kunne ikke slette kjelleren.')
      }
    },
  })

  const shareMutation = useMutation({
    mutationFn: () => generateShareLink(cellar.id),
    onSuccess: ({ url }) => setShareUrl(url),
    onError: () => setError('Kunne ikke generere delingslenke.'),
  })

  const leaveMutation = useMutation({
    mutationFn: async () => {
      // find own userId via members list — use username match as proxy
      const members = await getCellarMembers(cellar.id)
      const me = members.find(m => m.username === username)
      if (!me) throw new Error('Fant ikke bruker')
      return removeMember(cellar.id, me.userId)
    },
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['cellar', cellar.id] })
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('400') ? 'Du kan ikke forlate kjelleren som eneste eier.' : 'Noe gikk galt.')
    },
  })

  return (
    <div className="bg-surface rounded-xl border border-stone p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {renaming ? (
          <input
            className="border border-stone rounded-lg px-3 py-1.5 text-sm bg-warm text-bark focus:outline-none focus:border-wine flex-1"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            autoFocus
          />
        ) : (
          <button
            className="text-left font-medium text-bark bg-transparent border-0 p-0 text-sm hover:text-wine"
            onClick={() => setActiveCellar(cellar)}
          >
            {cellar.name}
          </button>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full ${cellar.role === 'owner' ? 'bg-wine/10 text-wine' : 'bg-stone text-clay'}`}>
          {cellar.role === 'owner' ? 'Eier' : 'Medlem'}
        </span>
      </div>

      <p className="text-xs text-clay">{cellar.memberCount} {cellar.memberCount === 1 ? 'medlem' : 'medlemmer'}</p>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {cellar.role === 'owner' && !renaming && (
          <>
            <button className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => { setRenaming(true); setError(null) }}>
              <Pencil size={13} /> Endre navn
            </button>
            <button
              className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              onClick={() => { setShareUrl(null); setError(null); shareMutation.mutate() }}
              disabled={shareMutation.isPending}
            >
              <Share2 size={13} /> {shareMutation.isPending ? 'Genererer…' : 'Del kjeller'}
            </button>
            <button
              className="secondary text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
              onClick={() => { setError(null); deleteMutation.mutate() }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={13} /> Slett
            </button>
          </>
        )}

        {renaming && (
          <>
            <button className="text-xs px-3 py-1.5" onClick={() => renameMutation.mutate()} disabled={renameMutation.isPending}>
              {renameMutation.isPending ? 'Lagrer…' : 'Lagre'}
            </button>
            <button className="secondary text-xs px-3 py-1.5" onClick={() => { setRenaming(false); setRenameValue(cellar.name) }}>
              Avbryt
            </button>
          </>
        )}

        {cellar.role === 'member' && (
          <button
            className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            onClick={() => { setError(null); leaveMutation.mutate() }}
            disabled={leaveMutation.isPending}
          >
            {leaveMutation.isPending ? 'Forlater…' : 'Forlat kjeller'}
          </button>
        )}

        <button className="secondary text-xs px-3 py-1.5" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Skjul medlemmer' : 'Vis medlemmer'}
        </button>
      </div>

      {shareUrl && (
        <div className="bg-warm rounded-lg p-3 space-y-1">
          <p className="text-xs text-clay">Delingslenke (gyldig i 7 dager):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all">{shareUrl}</code>
            <button className="secondary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1.5" onClick={() => navigator.clipboard.writeText(shareUrl)}>
              <Copy size={13} /> Kopier
            </button>
          </div>
        </div>
      )}

      {expanded && <CellarMemberList cellarId={cellar.id} />}
    </div>
  )
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start max-w-2xl mx-auto">
      {/* Left column: profile info + password + app info */}
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
            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="secondary text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
              >
                <LogOut size={14} /> Logg ut
              </button>
            </div>
          </div>
        </section>

        <PasswordSection />

        <section className="flex flex-col items-start gap-2">
          <button
            onClick={handleForceRefresh}
            disabled={refreshing}
            className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> {refreshing ? 'Oppdaterer…' : 'Se etter ny versjon'}
          </button>
          <p className="text-xs text-clay">
            Bygd {new Date(__BUILD_TIME__).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </section>
      </div>

      {/* Right column: cellars */}
      <div>
        <CellarSection />
      </div>
    </div>
  )
}
