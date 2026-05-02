import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import type { AdminUser } from '../api/types'

function ResetPasswordForm({ userId, onDone }: { userId: number; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.patch(`/admin/users/${userId}/password`, { newPassword: password }),
    onSuccess: () => {
      setSuccess(true)
      setPassword('')
      setTimeout(onDone, 1500)
    },
  })

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="password"
        placeholder="Nytt passord"
        autoComplete="new-password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border border-stone rounded-lg px-3 py-1.5 text-sm bg-surface text-bark focus:outline-none focus:border-wine"
      />
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !password}
        className="text-xs px-3 py-1.5"
      >
        {mutation.isPending ? 'Lagrer…' : 'Lagre'}
      </button>
      <button className="secondary text-xs px-3 py-1.5" onClick={onDone}>
        Avbryt
      </button>
      {success && <span className="text-green-700 text-xs">Passord oppdatert.</span>}
      {mutation.isError && <span className="text-red-600 text-xs">Noe gikk galt.</span>}
    </div>
  )
}

export default function AdminPage() {
  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users'),
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
    </div>
  )
}
