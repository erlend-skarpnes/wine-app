import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'

export default function ResetPasswordForm({ userId, onDone }: { userId: number; onDone: () => void }) {
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
