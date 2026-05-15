import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, KeyRound, Plus, Star } from 'lucide-react'
import Modal from '../components/Modal'
import HomeRow from '../components/HomeRow'
import WineDetailModal from '../components/WineDetailModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { api } from '../api/client'
import { createHome } from '../api/homes'
import { getDrinkHistory } from '../api/history'
import { getFavorites } from '../api/favorites'
import { queryKeys } from '../api/queryKeys'
import type { DrinkHistoryItem, FavoriteItem } from '../api/types'

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

// --- Favorites ---

function FavoritesSection() {
  const [selected, setSelected] = useState<FavoriteItem | null>(null)

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: getFavorites,
  })

  if (isLoading) return null
  if (favorites.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <p className="text-[0.65rem] font-semibold text-clay uppercase tracking-widest">Favoritter</p>

      <div className="-mx-6">
        {favorites.map((item, i) => {
          const accent = typeAccentColor(item.wineType)
          return (
            <button
              key={item.barcode}
              type="button"
              onClick={() => setSelected(item)}
              className="relative w-full flex items-center pl-6 pr-5 py-3 border-b border-stone bg-transparent text-left"
              style={{ animation: `entrySlideIn 0.3s ease-out ${i * 35}ms both` }}
            >
              <div
                className="absolute left-0 rounded-r-full"
                style={{ background: accent, width: '3px', top: '18%', bottom: '18%' }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="leading-snug truncate"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.08rem', fontWeight: 600, color: 'var(--color-bark)' }}
                >
                  {item.wineName ?? item.barcode}
                </p>
                {item.wineType && <p className="text-[0.73rem] text-clay mt-0.5">{item.wineType}</p>}
              </div>
              <Star size={14} className="ml-4 shrink-0" style={{ color: '#b5881f' }} fill="#b5881f" />
            </button>
          )
        })}
      </div>

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.wineName}
          quantity={0}
          onAdjusted={() => {}}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}

// --- Drink history ---

function typeAccentColor(type: string | null): string {
  if (!type) return '#722F37'
  const t = type.toLowerCase()
  if (t.includes('hvit')) return '#b5881f'
  if (t.includes('rosé') || t.includes('rose')) return '#c47080'
  if (t.includes('musserende') || t.includes('champagne') || t.includes('cava') || t.includes('prosecco')) return '#6b8f5e'
  return '#722F37'
}

function DrinkHistorySection() {
  const [selected, setSelected] = useState<DrinkHistoryItem | null>(null)

  const { data: history = [], isLoading } = useQuery({
    queryKey: queryKeys.drinkHistory(),
    queryFn: getDrinkHistory,
  })

  if (isLoading) return null
  if (history.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <p className="text-[0.65rem] font-semibold text-clay uppercase tracking-widest">Drukket</p>

      <div className="-mx-6">
        {history.map((item, i) => {
          const accent = typeAccentColor(item.wineType)
          const date = new Date(item.drankAt)
          const dateStr = date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' })
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="relative w-full flex items-center pl-6 pr-5 py-3 border-b border-stone bg-transparent text-left"
              style={{ animation: `entrySlideIn 0.3s ease-out ${i * 35}ms both` }}
            >
              <div
                className="absolute left-0 rounded-r-full"
                style={{ background: accent, width: '3px', top: '18%', bottom: '18%', opacity: 0.6 }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="leading-snug truncate"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.08rem', fontWeight: 600, color: 'var(--color-bark)' }}
                >
                  {item.wineName ?? item.barcode}
                </p>
                <p className="text-[0.73rem] text-clay mt-0.5">{dateStr} · {item.homeName}</p>
              </div>
              <div className="ml-4 shrink-0 text-right">
                <span
                  className="text-[1.35rem] leading-none font-semibold"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: accent }}
                >
                  {item.quantity}
                </span>
                <p className="text-[0.6rem] text-clay uppercase tracking-wide">fl.</p>
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.wineName}
          homeId={selected.homeId}
          quantity={0}
          onAdjusted={() => {}}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
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

      <FavoritesSection />

      <DrinkHistorySection />

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
