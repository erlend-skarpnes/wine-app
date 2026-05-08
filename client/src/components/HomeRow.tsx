import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Share2, Trash2, Copy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { renameHome, deleteHome, generateShareLink, removeMember, getHomeMembers } from '../api/homes'
import { createLocation, getLocations } from '../api/locations'
import type { HomeMember, HomeSummary, Location } from '../api/types'
import LocationRow from './LocationRow'

interface Props {
  home: HomeSummary
  onChanged: () => void
}

export default function HomeRow({ home, onChanged }: Props) {
  const { username } = useAuth()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(home.name)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [newLocationName, setNewLocationName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: members = [], isLoading: membersLoading } = useQuery<HomeMember[]>({
    queryKey: ['home-members', home.id],
    queryFn: () => getHomeMembers(home.id),
    enabled: expanded,
  })

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ['locations', home.id],
    queryFn: () => getLocations(home.id),
    enabled: expanded,
  })

  function invalidateHomes() {
    queryClient.invalidateQueries({ queryKey: ['homes'] })
    onChanged()
  }

  function invalidateLocations() {
    queryClient.invalidateQueries({ queryKey: ['locations', home.id] })
  }

  const renameMutation = useMutation({
    mutationFn: () => renameHome(home.id, renameValue),
    onSuccess: () => { setRenaming(false); invalidateHomes() },
    onError: () => setError('Kunne ikke endre navn.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteHome(home.id),
    onSuccess: invalidateHomes,
    onError: (err) => {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('409')) {
        setError(
          msg.includes('flasker')
            ? 'Hjemmet inneholder fremdeles flasker. Tøm det før du sletter.'
            : 'Du kan ikke slette ditt siste hjem.'
        )
      } else {
        setError('Kunne ikke slette hjemmet.')
      }
    },
  })

  const shareMutation = useMutation({
    mutationFn: () => generateShareLink(home.id),
    onSuccess: ({ url }) => setShareUrl(url),
    onError: () => setError('Kunne ikke generere delingslenke.'),
  })

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const allMembers = await getHomeMembers(home.id)
      const me = allMembers.find(m => m.username === username)
      if (!me) throw new Error('Fant ikke bruker')
      return removeMember(home.id, me.userId)
    },
    onSuccess: () => {
      invalidateHomes()
      queryClient.invalidateQueries({ queryKey: ['home-members', home.id] })
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('400') ? 'Du kan ikke forlate hjemmet som eier. Slett hjemmet i stedet.' : 'Noe gikk galt.')
    },
  })

  const createLocationMutation = useMutation({
    mutationFn: () => createLocation(home.id, newLocationName),
    onSuccess: () => { setNewLocationName(''); invalidateLocations() },
    onError: () => setError('Kunne ikke opprette plasseringen.'),
  })

  return (
    <div data-testid="home-row" className="bg-surface rounded-xl border border-stone p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {renaming ? (
          <input
            className="border border-stone rounded-lg px-3 py-1.5 text-sm bg-warm text-bark focus:outline-none focus:border-wine flex-1"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            autoFocus
          />
        ) : (
          <span className="font-medium text-bark text-sm">{home.name}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full ${home.isOwner ? 'bg-wine/10 text-wine' : 'bg-stone text-clay'}`}>
          {home.isOwner ? 'Eier' : 'Medlem'}
        </span>
      </div>

      <p className="text-xs text-clay">{home.memberCount} {home.memberCount === 1 ? 'medlem' : 'medlemmer'}</p>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {home.isOwner && !renaming && (
          <>
            <button className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => { setRenaming(true); setError(null) }}>
              <Pencil size={13} /> Endre navn
            </button>
            <button
              className="secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              onClick={() => { setShareUrl(null); setError(null); shareMutation.mutate() }}
              disabled={shareMutation.isPending}
            >
              <Share2 size={13} /> {shareMutation.isPending ? 'Genererer…' : 'Del hjem'}
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
            <button className="secondary text-xs px-3 py-1.5" onClick={() => { setRenaming(false); setRenameValue(home.name) }}>
              Avbryt
            </button>
          </>
        )}

        {!home.isOwner && (
          <button
            className="secondary text-xs px-3 py-1.5"
            onClick={() => { setError(null); leaveMutation.mutate() }}
            disabled={leaveMutation.isPending}
          >
            {leaveMutation.isPending ? 'Forlater…' : 'Forlat hjem'}
          </button>
        )}

        <button className="secondary text-xs px-3 py-1.5" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Skjul detaljer' : 'Vis detaljer'}
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

      {expanded && (
        <div className="space-y-4 pt-3 border-t border-stone">
          <div>
            <p className="text-xs font-semibold text-clay uppercase tracking-wide mb-2">Medlemmer</p>
            {membersLoading ? (
              <p className="text-clay text-xs">Laster…</p>
            ) : (
              <ul className="space-y-1">
                {members.map(m => (
                  <li key={m.userId} className="flex items-center gap-2 text-sm">
                    <span>{m.username}</span>
                    {m.isOwner && (
                      <span className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full">Eier</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-clay uppercase tracking-wide mb-2">Oppbevaring</p>
            {locationsLoading ? (
              <p className="text-clay text-xs">Laster…</p>
            ) : (
              <div className="space-y-2">
                {locations.map(loc => (
                  <LocationRow
                    key={loc.id}
                    homeId={home.id}
                    location={loc}
                    isOwner={home.isOwner}
                    onChanged={invalidateLocations}
                  />
                ))}
                {home.isOwner && (
                  <form
                    onSubmit={e => { e.preventDefault(); if (newLocationName.trim()) createLocationMutation.mutate() }}
                    className="flex gap-2"
                  >
                    <input
                      className="border border-stone rounded-lg px-3 py-1.5 text-sm bg-surface flex-1 focus:outline-none focus:border-wine"
                      value={newLocationName}
                      onChange={e => setNewLocationName(e.target.value)}
                      placeholder="Ny plassering…"
                    />
                    <button type="submit" className="text-sm px-3 py-1.5" disabled={!newLocationName.trim() || createLocationMutation.isPending}>
                      {createLocationMutation.isPending ? '…' : 'Legg til'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
