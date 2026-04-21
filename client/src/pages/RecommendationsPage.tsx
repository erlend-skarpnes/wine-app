import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Recommendation } from '../api/types'

export default function RecommendationsPage() {
  const [input, setInput] = useState('')
  const [foods, setFoods] = useState<string[]>([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations', foods],
    queryFn: () => {
      const qs = foods.map(f => `foods=${encodeURIComponent(f)}`).join('&')
      return api.get<Recommendation[]>(`/recommendations${qs ? `?${qs}` : ''}`)
    },
  })

  function addFood() {
    const trimmed = input.trim()
    if (trimmed && !foods.includes(trimmed)) {
      setFoods(f => [...f, trimmed])
    }
    setInput('')
  }

  return (
    <div>
      <h2>Wine Recommendations</h2>

      <div style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          Enter what you're eating to find matching wines from your cellar.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFood() } }}
            placeholder="e.g. steak, salmon, pasta..."
          />
          <button type="button" onClick={addFood}>Add</button>
        </div>

        {foods.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {foods.map(f => (
              <span
                key={f}
                className="badge"
                style={{ cursor: 'pointer' }}
                onClick={() => setFoods(fs => fs.filter(x => x !== f))}
              >
                {f} &times;
              </span>
            ))}
          </div>
        )}
      </div>

      {isLoading && <p className="muted">Finding recommendations...</p>}
      {error && <p className="error">Failed to fetch recommendations.</p>}
      {data?.length === 0 && (
        <p className="muted">No wines in your cellar match the selected food.</p>
      )}

      <div className="grid">
        {data?.map(rec => (
          <div key={rec.cellarEntry.id} className="card">
            <strong>{rec.wine.name}</strong>
            {rec.wine.vintage && <span className="muted"> {rec.wine.vintage}</span>}
            <p className="muted" style={{ marginTop: '0.2rem' }}>
              {rec.wine.winery} &middot; {rec.wine.varietal}
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--wine)' }}>
              {rec.reason}
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="badge">{rec.cellarEntry.quantity} {rec.cellarEntry.quantity === 1 ? 'bottle' : 'bottles'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
