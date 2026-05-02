import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { AdminUser } from '../api/types'

export default function AdminPage() {
  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users'),
  })

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
                </tr>
              </thead>
              <tbody>
                {users?.map(user => (
                  <tr key={user.id} className="border-b border-stone last:border-0">
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">
                      {user.isAdmin
                        ? <span className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full font-medium">Admin</span>
                        : <span className="text-clay text-xs">Bruker</span>
                      }
                    </td>
                  </tr>
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
    </div>
  )
}
