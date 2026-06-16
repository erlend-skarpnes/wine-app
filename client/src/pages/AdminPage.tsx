import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { AdminUser, WineSampleSummary } from '../api/types'
import ResetPasswordForm from '../components/ResetPasswordForm'
import { getAdminSamples } from '../api/samples'
import { queryKeys } from '../api/queryKeys'

export default function AdminPage() {
  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users'),
  })

  const { data: samples = [], isLoading: samplesLoading } = useQuery<WineSampleSummary[]>({
    queryKey: queryKeys.adminSamples(),
    queryFn: getAdminSamples,
  })

  const [resetUserId, setResetUserId] = useState<number | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function generateInvite() {
    setGenerating(true)
    setInviteUrl(null)
    try {
      const { url } = await api.post<{ url: string }>('/admin/invites', {})
      setInviteUrl(url)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-bark mb-4">Brukere</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : (
          <div className="bg-surface rounded-xl border border-stone overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone text-left text-clay">
                  <th className="px-4 py-3 font-medium">Brukernavn</th>
                  <th className="px-4 py-3 font-medium">Rolle</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users?.map(user => (
                  <>
                    <tr key={user.id} className={`border-b border-stone ${resetUserId === user.id ? '' : 'last:border-0'}`}>
                      <td className="px-4 py-3">{user.username}</td>
                      <td className="px-4 py-3">
                        {user.isAdmin
                          ? <span className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full font-medium">Admin</span>
                          : <span className="text-clay text-xs">Bruker</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        {resetUserId !== user.id && (
                          <button
                            className="secondary text-xs px-3 py-1.5"
                            onClick={() => setResetUserId(user.id)}
                          >
                            Tilbakestill passord
                          </button>
                        )}
                      </td>
                    </tr>
                    {resetUserId === user.id && (
                      <tr key={`${user.id}-reset`} className="border-b border-stone last:border-0 bg-warm">
                        <td colSpan={3} className="px-4 py-3">
                          <ResetPasswordForm userId={user.id} onDone={() => setResetUserId(null)} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-bark mb-4">Invitasjoner</h2>
        <button onClick={generateInvite} disabled={generating}>
          {generating ? 'Genererer…' : 'Generer invitasjonslenke'}
        </button>
        {inviteUrl && (
          <div className="mt-4 bg-surface border border-stone rounded-xl p-4 space-y-2">
            <p className="text-xs text-clay">Lenken er gyldig i 7 dager:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-warm px-3 py-2 rounded-lg break-all">{inviteUrl}</code>
              <button
                className="secondary shrink-0"
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
              >
                Kopier
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-bark mb-4">Etikett-sammenligninger</h2>
        {samplesLoading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : samples.length === 0 ? (
          <p className="text-clay text-sm">Ingen prøver ennå.</p>
        ) : (
          <div className="space-y-4">
            {samples.map(s => (
              <div key={s.id} className="bg-surface border border-stone rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-stone bg-warm flex items-center justify-between">
                  <span className="text-sm font-medium text-bark">{s.barcode}</span>
                  <span className="text-xs text-clay">
                    {s.username} · {new Date(s.createdAt).toLocaleDateString('nb-NO')} · {Math.round(s.confidence * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-stone text-sm">
                  <div className="p-4 space-y-1">
                    <p className="text-xs font-medium text-clay uppercase tracking-wide mb-2">Vinmonopolet</p>
                    <p className="text-bark">{s.vinmonopoletName ?? <span className="italic">–</span>}</p>
                    <p className="text-clay">{s.vinmonopoletType ?? '–'}</p>
                    {s.vinmonopoletGrapes.length > 0 && <p className="text-xs text-clay">{s.vinmonopoletGrapes.join(', ')}</p>}
                    {s.vinmonopoletPairings.length > 0 && <p className="text-xs text-clay">{s.vinmonopoletPairings.join(', ')}</p>}
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-xs font-medium text-clay uppercase tracking-wide mb-2">Etikett-API</p>
                    <p className={s.labelName !== s.vinmonopoletName ? 'text-wine font-medium' : 'text-bark'}>
                      {s.labelName ?? <span className="italic">–</span>}
                    </p>
                    <p className={s.labelType !== s.vinmonopoletType ? 'text-wine' : 'text-clay'}>
                      {s.labelType ?? '–'}
                    </p>
                    {s.labelGrapes.length > 0 && <p className="text-xs text-clay">{s.labelGrapes.join(', ')}</p>}
                    {s.labelPairings.length > 0 && <p className="text-xs text-clay">{s.labelPairings.join(', ')}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
