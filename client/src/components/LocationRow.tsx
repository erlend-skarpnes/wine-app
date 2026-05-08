import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { renameLocation, deleteLocation, createSection, renameSection, deleteSection } from '../api/locations'
import type { Location } from '../api/types'

interface Props {
  homeId: number
  location: Location
  isOwner: boolean
  onChanged: () => void
}

export default function LocationRow({ homeId, location, isOwner, onChanged }: Props) {
  const queryClient = useQueryClient()
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(location.name)
  const [expanded, setExpanded] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [renamingSectionId, setRenamingSectionId] = useState<number | null>(null)
  const [renameSectionValue, setRenameSectionValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['locations', homeId] })
    onChanged()
  }

  const renameMutation = useMutation({
    mutationFn: () => renameLocation(homeId, location.id, renameValue),
    onSuccess: () => { setRenaming(false); invalidate() },
    onError: () => setError('Kunne ikke endre navn.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLocation(homeId, location.id),
    onSuccess: invalidate,
    onError: (err) => {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg.includes('flasker')
          ? 'Plasseringen inneholder fremdeles flasker. Tøm den før du sletter.'
          : 'Kunne ikke slette plasseringen.'
      )
    },
  })

  const createSectionMutation = useMutation({
    mutationFn: () => createSection(homeId, location.id, newSectionName),
    onSuccess: () => { setNewSectionName(''); invalidate() },
    onError: () => setError('Kunne ikke opprette seksjonen.'),
  })

  const renameSectionMutation = useMutation({
    mutationFn: () => renameSection(homeId, location.id, renamingSectionId!, renameSectionValue),
    onSuccess: () => { setRenamingSectionId(null); invalidate() },
    onError: () => setError('Kunne ikke endre navn.'),
  })

  const deleteSectionMutation = useMutation({
    mutationFn: (secId: number) => deleteSection(homeId, location.id, secId),
    onSuccess: invalidate,
    onError: (err) => {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('flasker') ? 'Seksjonen inneholder fremdeles flasker.' : 'Kunne ikke slette seksjonen.')
    },
  })

  return (
    <div data-testid="location-row" className="border border-stone rounded-lg p-3 space-y-2 bg-warm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {renaming ? (
          <input
            className="border border-stone rounded-lg px-3 py-1 text-sm bg-surface flex-1 focus:outline-none focus:border-wine"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-bark">{location.name}</span>
            {location.isDefault && (
              <span className="text-xs bg-stone text-clay px-2 py-0.5 rounded-full">Standard</span>
            )}
            {location.sections.length > 0 && (
              <span className="text-xs text-clay">{location.sections.length} seksjon{location.sections.length !== 1 ? 'er' : ''}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          {isOwner && !renaming && !location.isDefault && (
            <>
              <button className="secondary text-xs p-1.5" onClick={() => { setRenaming(true); setError(null) }} title="Endre navn">
                <Pencil size={12} />
              </button>
              <button
                className="secondary text-xs p-1.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { setError(null); deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
                title="Slett"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
          {renaming && (
            <>
              <button className="text-xs px-2 py-1" onClick={() => renameMutation.mutate()} disabled={renameMutation.isPending}>
                {renameMutation.isPending ? '…' : 'Lagre'}
              </button>
              <button className="secondary text-xs px-2 py-1" onClick={() => { setRenaming(false); setRenameValue(location.name) }}>
                Avbryt
              </button>
            </>
          )}
          <button className="secondary text-xs px-2 py-1" onClick={() => setExpanded(v => !v)}>
            {expanded ? 'Skjul' : 'Seksjoner'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {expanded && (
        <div className="pl-3 space-y-2 pt-1 border-t border-stone">
          {location.sections.map(section => (
            <div key={section.id} className="flex items-center gap-2">
              {renamingSectionId === section.id ? (
                <>
                  <input
                    className="border border-stone rounded px-2 py-1 text-xs bg-surface flex-1 focus:outline-none focus:border-wine"
                    value={renameSectionValue}
                    onChange={e => setRenameSectionValue(e.target.value)}
                    autoFocus
                  />
                  <button className="text-xs px-2 py-1" onClick={() => renameSectionMutation.mutate()} disabled={renameSectionMutation.isPending}>
                    {renameSectionMutation.isPending ? '…' : 'Lagre'}
                  </button>
                  <button className="secondary text-xs px-2 py-1" onClick={() => setRenamingSectionId(null)}>
                    Avbryt
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-bark flex-1">{section.name}</span>
                  {isOwner && (
                    <>
                      <button
                        className="secondary text-xs p-1.5"
                        onClick={() => { setRenamingSectionId(section.id); setRenameSectionValue(section.name) }}
                        title="Endre navn"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="secondary text-xs p-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setError(null); deleteSectionMutation.mutate(section.id) }}
                        disabled={deleteSectionMutation.isPending}
                        title="Slett"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}

          {isOwner && (
            <form
              onSubmit={e => { e.preventDefault(); if (newSectionName.trim()) createSectionMutation.mutate() }}
              className="flex gap-2 mt-1"
            >
              <input
                className="border border-stone rounded px-2 py-1 text-xs bg-surface flex-1 focus:outline-none focus:border-wine"
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                placeholder="Ny seksjon…"
              />
              <button type="submit" className="text-xs px-2 py-1" disabled={!newSectionName.trim() || createSectionMutation.isPending}>
                {createSectionMutation.isPending ? '…' : 'Legg til'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
