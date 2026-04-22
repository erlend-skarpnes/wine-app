import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { CellarEntry } from '../api/types'
import ScanModal from '../components/ScanModal'
import WineDetailModal from '../components/WineDetailModal'

type ModalMode = 'add' | 'remove' | null

export default function CellarPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<CellarEntry | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [storageFilter, setStorageFilter] = useState<'all' | 'drink-now' | 'store'>('all')

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['cellar'],
    queryFn: () => api.get<CellarEntry[]>('/cellar'),
  })

  function handleAdjusted() {
    queryClient.invalidateQueries({ queryKey: ['cellar'] })
  }

  const allPairings = [...new Set(entries?.flatMap(e => e.pairings) ?? [])].sort()

  function matchesStorageFilter(entry: CellarEntry) {
    if (storageFilter === 'all') return true
    const sp = entry.storagePotential
    const isDrinkNow = !sp || !sp.toLowerCase().includes('kan også lagres')
    return storageFilter === 'drink-now' ? isDrinkNow : !isDrinkNow
  }

  const visibleEntries = entries?.filter(e =>
    (!activeFilter || e.pairings.includes(activeFilter)) &&
    matchesStorageFilter(e)
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>My Cellar</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => setModal('add')}>+ Add wine</button>
          <button type="button" className="secondary" onClick={() => setModal('remove')}>− Remove wine</button>
        </div>
      </div>

      {isLoading && <p className="muted">Loading…</p>}
      {error && <p className="error">Failed to load cellar.</p>}

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: allPairings.length > 0 ? '0.5rem' : '1rem' }}>
        {(['all', 'drink-now', 'store'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => setStorageFilter(opt)}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.8rem',
              background: storageFilter === opt ? 'var(--wine)' : 'var(--surface)',
              color: storageFilter === opt ? 'white' : 'var(--muted)',
              border: '1px solid',
              borderColor: storageFilter === opt ? 'var(--wine)' : 'var(--border)',
            }}
          >
            {opt === 'all' ? 'All' : opt === 'drink-now' ? 'Drink now' : 'Can store'}
          </button>
        ))}
      </div>

      {allPairings.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
          {allPairings.map(pairing => (
            <button
              key={pairing}
              type="button"
              onClick={() => setActiveFilter(prev => prev === pairing ? null : pairing)}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                background: activeFilter === pairing ? 'var(--wine)' : 'var(--surface)',
                color: activeFilter === pairing ? 'white' : 'var(--muted)',
                border: '1px solid',
                borderColor: activeFilter === pairing ? 'var(--wine)' : 'var(--border)',
              }}
            >
              {pairing}
            </button>
          ))}
        </div>
      )}

      {!isLoading && !error && !entries?.length && (
        <p className="muted">Your cellar is empty. Scan a bottle to add it.</p>
      )}

      {visibleEntries && visibleEntries.length > 0 && (
        <table className="wine-table">
          <thead>
            <tr>
              <th>Wine</th>
              <th style={{ textAlign: 'right' }}>Bottles</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries!.map(entry => (
              <tr key={entry.barcode} onClick={() => setSelected(entry)} style={{ cursor: 'pointer' }}>
                <td>{entry.name ?? entry.barcode}</td>
                <td style={{ textAlign: 'right' }}><span className="badge">{entry.quantity}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <ScanModal
          mode={modal}
          onClose={() => setModal(null)}
          onAdjusted={handleAdjusted}
        />
      )}

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
