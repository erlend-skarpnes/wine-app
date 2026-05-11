import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Copy, Share2, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { renameHome, deleteHome, generateShareLink, removeMember, getHomeMembers } from '../api/homes'
import { ApiError } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { createLocation, getLocations } from '../api/locations'
import type { HomeMember, HomeSummary, Location } from '../api/types'
import Modal from './Modal'
import LocationManageModal from './LocationManageModal'

interface Props {
  home: HomeSummary
  onClose: () => void
  onChanged: () => void
}

export default function HomeManageModal({ home, onClose, onChanged }: Props) {
  const { username } = useAuth()
  const queryClient = useQueryClient()
  const [renameValue, setRenameValue] = useState(home.name)
  const [newLocationName, setNewLocationName] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [managingLocation, setManagingLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: members = [], isLoading: membersLoading } = useQuery<HomeMember[]>({
    queryKey: queryKeys.homeMembers(home.id),
    queryFn: () => getHomeMembers(home.id),
  })

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: queryKeys.locations(home.id),
    queryFn: () => getLocations(home.id),
  })

  function invalidateHomes() {
    queryClient.invalidateQueries({ queryKey: queryKeys.homes() })
    onChanged()
  }

  function invalidateLocations() {
    queryClient.invalidateQueries({ queryKey: queryKeys.locations(home.id) })
  }

  const renameMutation = useMutation({
    mutationFn: () => renameHome(home.id, renameValue),
    onSuccess: () => { setError(null); invalidateHomes() },
    onError: () => setError('Kunne ikke endre navn.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteHome(home.id),
    onSuccess: () => { invalidateHomes(); onClose() },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'BOTTLES_REMAINING')
        setError('Hjemmet inneholder fremdeles flasker. Tøm det før du sletter.')
      else if (err instanceof ApiError && err.code === 'LAST_HOME')
        setError('Du kan ikke slette ditt siste hjem.')
      else
        setError('Kunne ikke slette hjemmet.')
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
      queryClient.invalidateQueries({ queryKey: queryKeys.homeMembers(home.id) })
      onClose()
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'OWNER_CANNOT_LEAVE')
        setError('Du kan ikke forlate hjemmet som eier. Slett hjemmet i stedet.')
      else
        setError('Noe gikk galt.')
    },
  })

  const createLocationMutation = useMutation({
    mutationFn: () => createLocation(home.id, newLocationName),
    onSuccess: () => { setNewLocationName(''); invalidateLocations() },
    onError: () => setError('Kunne ikke opprette plasseringen.'),
  })

  // When a location is updated inside LocationManageModal, refresh and sync the location object
  function handleLocationChanged() {
    invalidateLocations()
  }

  // After location list refreshes, keep managingLocation in sync
  const syncedManagingLocation = managingLocation
    ? (locations.find(l => l.id === managingLocation.id) ?? managingLocation)
    : null

  return (
    <>
      <Modal title={home.name} onClose={onClose} maxWidth="max-w-md">
        <div className="space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Rename */}
          {home.isOwner && (
            <div>
              <p className="text-xs font-semibold text-clay uppercase tracking-wide mb-2">Navn</p>
              <div className="flex gap-2">
                <input
                  className="border border-stone rounded-lg px-3 py-2 text-sm bg-surface flex-1 focus:outline-none focus:border-wine"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                />
                <button
                  type="button"
                  className="px-4 py-2 text-sm"
                  onClick={() => renameMutation.mutate()}
                  disabled={renameMutation.isPending || renameValue === home.name || !renameValue.trim()}
                >
                  {renameMutation.isPending ? '…' : 'Lagre'}
                </button>
              </div>
            </div>
          )}

          {/* Locations */}
          <div>
            <p className="text-xs font-semibold text-clay uppercase tracking-wide mb-2">Plasseringer</p>
            {locationsLoading ? (
              <p className="text-clay text-sm">Laster…</p>
            ) : (
              <div className="divide-y divide-stone border border-stone rounded-lg overflow-hidden">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    data-testid="location-row"
                    className="w-full flex items-center gap-3 px-4 py-3 bg-surface hover:bg-warm transition-colors text-left"
                    onClick={() => { setError(null); setManagingLocation(loc) }}
                  >
                    <span className="flex-1 text-sm font-medium text-bark">{loc.name}</span>
                    {loc.isDefault && (
                      <span className="text-xs bg-stone text-clay px-2 py-0.5 rounded-full shrink-0">Standard</span>
                    )}
                    {loc.sections.length > 0 && (
                      <span className="text-xs text-clay shrink-0">
                        {loc.sections.length} seksjon{loc.sections.length !== 1 ? 'er' : ''}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-clay shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {home.isOwner && (
              <form
                onSubmit={e => { e.preventDefault(); if (newLocationName.trim()) createLocationMutation.mutate() }}
                className="flex gap-2 mt-3"
              >
                <input
                  className="border border-stone rounded-lg px-3 py-2 text-sm bg-surface flex-1 focus:outline-none focus:border-wine"
                  value={newLocationName}
                  onChange={e => setNewLocationName(e.target.value)}
                  placeholder="Ny plassering…"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm"
                  disabled={!newLocationName.trim() || createLocationMutation.isPending}
                >
                  {createLocationMutation.isPending ? '…' : 'Legg til'}
                </button>
              </form>
            )}
          </div>

          {/* Members */}
          <div>
            <p className="text-xs font-semibold text-clay uppercase tracking-wide mb-2">Medlemmer</p>
            {membersLoading ? (
              <p className="text-clay text-sm">Laster…</p>
            ) : (
              <ul className="space-y-1.5">
                {members.map(m => (
                  <li key={m.userId} className="flex items-center gap-2 text-sm">
                    <span className="text-bark">{m.username}</span>
                    {m.isOwner && (
                      <span className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full">Eier</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Share link */}
          {home.isOwner && (
            <div>
              <p className="text-xs font-semibold text-clay uppercase tracking-wide mb-2">Del hjem</p>
              <button
                type="button"
                className="secondary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
                onClick={() => { setShareUrl(null); setError(null); shareMutation.mutate() }}
                disabled={shareMutation.isPending}
              >
                <Share2 size={16} /> {shareMutation.isPending ? 'Genererer…' : 'Generer delingslenke'}
              </button>
              {shareUrl && (
                <div className="bg-warm rounded-lg p-3 mt-2 space-y-1">
                  <p className="text-xs text-clay">Gyldig i 7 dager:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs break-all">{shareUrl}</code>
                    <button
                      type="button"
                      className="secondary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1.5"
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                    >
                      <Copy size={13} /> Kopier
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Danger zone */}
          <div className="pt-2 border-t border-stone space-y-2">
            {home.isOwner ? (
              <button
                type="button"
                className="w-full py-2.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                onClick={() => { setError(null); deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={16} /> {deleteMutation.isPending ? 'Sletter…' : 'Slett hjem'}
              </button>
            ) : (
              <button
                type="button"
                className="secondary w-full py-2.5 text-sm"
                onClick={() => { setError(null); leaveMutation.mutate() }}
                disabled={leaveMutation.isPending}
              >
                {leaveMutation.isPending ? 'Forlater…' : 'Forlat hjem'}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {syncedManagingLocation && (
        <LocationManageModal
          homeId={home.id}
          location={syncedManagingLocation}
          isOwner={home.isOwner}
          onBack={() => setManagingLocation(null)}
          onClose={onClose}
          onChanged={handleLocationChanged}
        />
      )}
    </>
  )
}
