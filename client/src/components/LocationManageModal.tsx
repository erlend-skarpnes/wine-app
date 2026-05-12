import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Pencil, Trash2, X, Plus } from 'lucide-react'
import { renameLocation, deleteLocation, createSection, renameSection, deleteSection } from '../api/locations'
import { ApiError } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import type { Location } from '../api/types'

interface Props {
  homeId: number
  location: Location
  isOwner: boolean
  onBack: () => void
  onClose: () => void
  onChanged: () => void
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5">
      <span className="text-[0.62rem] font-semibold text-clay uppercase tracking-widest shrink-0">{children}</span>
      <div className="flex-1 h-px bg-stone" />
    </div>
  )
}

export default function LocationManageModal({ homeId, location, isOwner, onBack, onClose, onChanged }: Props) {
  const queryClient = useQueryClient()
  const [renameValue, setRenameValue] = useState(location.name)
  const [newSectionName, setNewSectionName] = useState('')
  const [renamingSectionId, setRenamingSectionId] = useState<number | null>(null)
  const [renameSectionValue, setRenameSectionValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.locations(homeId) })
    onChanged()
  }

  const renameMutation = useMutation({
    mutationFn: () => renameLocation(homeId, location.id, renameValue),
    onSuccess: () => { setError(null); invalidate() },
    onError: () => setError('Kunne ikke endre navn.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLocation(homeId, location.id),
    onSuccess: () => { invalidate(); onBack() },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'BOTTLES_REMAINING')
        setError('Plasseringen inneholder fremdeles flasker. Tøm den før du sletter.')
      else
        setError('Kunne ikke slette plasseringen.')
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
      if (err instanceof ApiError && err.code === 'BOTTLES_REMAINING')
        setError('Seksjonen inneholder fremdeles flasker.')
      else
        setError('Kunne ikke slette seksjonen.')
    },
  })

  return (
    <div
      className="fixed inset-x-0 top-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 200, height: 'calc(100dvh - var(--keyboard-height, 0px))' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface rounded-2xl w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col"
        style={{ maxHeight: 'calc(100dvh - var(--keyboard-height, 0px) - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-stone shrink-0">
          <button type="button" className="modal-close p-2 -ml-1" onClick={onBack} aria-label="Tilbake">
            <ChevronLeft size={16} />
          </button>
          <h3
            className="flex-1 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontWeight: 400, fontSize: '1.25rem' }}
          >
            {location.name}
          </h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Lukk"><X size={16} /></button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto flex-1">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Rename */}
          {isOwner && (
            <div>
              <SectionLabel>Navn</SectionLabel>
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
                  disabled={renameMutation.isPending || renameValue === location.name || !renameValue.trim()}
                >
                  {renameMutation.isPending ? '…' : 'Lagre'}
                </button>
              </div>
            </div>
          )}

          {/* Sections */}
          <div>
            <SectionLabel>Seksjoner</SectionLabel>
            <div className="rounded-xl border border-stone overflow-hidden divide-y divide-stone">
              {location.sections.length === 0 && (
                <p className="text-clay text-sm px-4 py-3">Ingen seksjoner ennå.</p>
              )}
              {location.sections.map(section => (
                <div key={section.id} data-testid="location-row" className="flex items-center gap-2 px-4 py-3 bg-surface">
                  {renamingSectionId === section.id ? (
                    <>
                      <input
                        className="border border-stone rounded-lg px-3 py-1.5 text-sm bg-warm flex-1 focus:outline-none focus:border-wine"
                        value={renameSectionValue}
                        onChange={e => setRenameSectionValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="text-sm px-3 py-1.5"
                        onClick={() => renameSectionMutation.mutate()}
                        disabled={renameSectionMutation.isPending}
                      >
                        {renameSectionMutation.isPending ? '…' : 'Lagre'}
                      </button>
                      <button
                        type="button"
                        className="secondary text-sm px-3 py-1.5"
                        onClick={() => setRenamingSectionId(null)}
                      >
                        Avbryt
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-bark">{section.name}</span>
                      {isOwner && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            className="secondary p-2"
                            onClick={() => { setRenamingSectionId(section.id); setRenameSectionValue(section.name) }}
                            aria-label="Endre navn"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="secondary p-2 bg-transparent border-red-200 text-red-500 hover:bg-red-50"
                            onClick={() => { setError(null); deleteSectionMutation.mutate(section.id) }}
                            disabled={deleteSectionMutation.isPending}
                            aria-label="Slett"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {isOwner && (
              <form
                onSubmit={e => { e.preventDefault(); if (newSectionName.trim()) createSectionMutation.mutate() }}
                className="flex gap-2 mt-2.5"
              >
                <input
                  className="border border-stone rounded-lg px-3 py-2 text-sm bg-surface flex-1 focus:outline-none focus:border-wine"
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  placeholder="Ny seksjon…"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm"
                  disabled={!newSectionName.trim() || createSectionMutation.isPending}
                >
                  <Plus size={13} />
                  {createSectionMutation.isPending ? '…' : 'Legg til'}
                </button>
              </form>
            )}
          </div>

          {/* Delete location */}
          {isOwner && (
            <div className="pt-1 border-t border-stone">
              <button
                type="button"
                className="w-full mt-3 py-2.5 text-sm bg-transparent rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => { setError(null); deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Sletter…' : 'Slett plassering'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
