import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { CellarEntry } from '../api/types'
import ScanModal from '../components/ScanModal'

type ModalMode = 'add' | 'remove' | null

export default function CellarPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<ModalMode>(null)

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['cellar'],
    queryFn: () => api.get<CellarEntry[]>('/cellar'),
  })

  function handleAdjusted() {
    queryClient.invalidateQueries({ queryKey: ['cellar'] })
  }

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

      {!isLoading && !error && !entries?.length && (
        <p className="muted">Your cellar is empty. Scan a bottle to add it.</p>
      )}

      {entries && entries.length > 0 && (
        <table className="wine-table">
          <thead>
            <tr>
              <th>Wine</th>
              <th style={{ textAlign: 'right' }}>Bottles</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.barcode}>
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
    </div>
  )
}
