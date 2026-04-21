import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { CellarEntry } from '../api/types'

export default function CellarPage() {
  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['cellar'],
    queryFn: () => api.get<CellarEntry[]>('/cellar'),
  })

  if (isLoading) return <p className="muted">Loading cellar...</p>
  if (error) return <p className="error">Failed to load cellar.</p>

  if (!entries?.length) return (
    <div>
      <h2>My Cellar</h2>
      <p className="muted">No wines yet. Add one to get started.</p>
    </div>
  )

  const totalBottles = entries.reduce((sum, e) => sum + e.quantity, 0)

  return (
    <div>
      <h2>My Cellar — {entries.length} wines, {totalBottles} bottles</h2>
      <div className="grid">
        {entries.map(entry => (
          <div key={entry.id} className="card">
            <strong>{entry.wine?.name}</strong>
            {entry.wine?.vintage && <span className="muted"> {entry.wine.vintage}</span>}
            <p className="muted" style={{ marginTop: '0.2rem' }}>
              {entry.wine?.winery} &middot; {entry.wine?.varietal}
            </p>
            {(entry.wine?.region || entry.wine?.country) && (
              <p className="muted">{[entry.wine.region, entry.wine.country].filter(Boolean).join(', ')}</p>
            )}
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge">{entry.quantity} {entry.quantity === 1 ? 'bottle' : 'bottles'}</span>
              {entry.location && <span className="muted">{entry.location}</span>}
            </div>
            {(entry.drinkFrom || entry.drinkUntil) && (
              <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                Drink {entry.drinkFrom ?? '?'}&ndash;{entry.drinkUntil ?? '?'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
