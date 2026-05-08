import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getShareTokenInfo, joinHome } from '../api/homes'
import { useHome } from '../context/HomeContext'

export default function JoinHomePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setActiveHome } = useHome()

  const { data: info, isLoading, isError } = useQuery({
    queryKey: ['home-join', token],
    queryFn: () => getShareTokenInfo(token!),
    retry: false,
  })

  const joinMutation = useMutation({
    mutationFn: () => joinHome(token!),
    onSuccess: (home) => {
      queryClient.invalidateQueries({ queryKey: ['homes'] })
      setActiveHome(home)
      navigate('/', { replace: true })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16"><div className="spinner" /></div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-clay">Invitasjonen er ugyldig eller utløpt.</p>
        <button className="secondary" onClick={() => navigate('/')}>Gå til forsiden</button>
      </div>
    )
  }

  const alreadyMember = joinMutation.isError &&
    joinMutation.error instanceof Error &&
    joinMutation.error.message.includes('409')

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center max-w-sm mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-bark mb-1">Du er invitert</h2>
        <p className="text-clay text-sm">Bli med i hjemmet <strong>{info?.homeName}</strong>.</p>
      </div>

      {alreadyMember ? (
        <>
          <p className="text-clay text-sm">Du er allerede medlem av dette hjemmet.</p>
          <button onClick={() => navigate('/')}>Gå til hjemmet</button>
        </>
      ) : (
        <>
          {joinMutation.isError && !alreadyMember && (
            <p className="text-red-600 text-sm">Noe gikk galt. Prøv igjen.</p>
          )}
          <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
            {joinMutation.isPending ? 'Blir med…' : 'Bli med'}
          </button>
          <button className="secondary" onClick={() => navigate('/')}>Avbryt</button>
        </>
      )}
    </div>
  )
}
