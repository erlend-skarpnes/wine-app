import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Share2, Trash2, Copy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCellar } from '../context/CellarContext'
import {
  renameCellar, deleteCellar, generateShareLink, removeMember, getCellarMembers,
} from '../api/cellars'
import type { CellarMember, CellarSummary } from '../api/types'

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

export default function CellarRow({ cellar }: { cellar: CellarSummary }) {
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
    <div data-testid="cellar-row" className="bg-surface rounded-xl border border-stone p-4 space-y-3">
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
