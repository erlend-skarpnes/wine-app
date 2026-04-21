import { useState, useCallback } from 'react'
import BarcodeScanner from './BarcodeScanner'
import { api } from '../api/client'
import type { CellarEntry } from '../api/types'

type Mode = 'add' | 'remove'

type ScanState =
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'success'; entry: CellarEntry }
  | { status: 'error'; message: string }

interface Props {
  mode: Mode
  onClose: () => void
  onAdjusted: () => void
}

export default function ScanModal({ mode, onClose, onAdjusted }: Props) {
  const [state, setState] = useState<ScanState>({ status: 'scanning' })

  const handleScan = useCallback(async (barcode: string) => {
    setState({ status: 'loading' })
    try {
      const delta = mode === 'add' ? 1 : -1
      const entry = await api.post<CellarEntry>('/cellar/adjust', { barcode, delta })
      setState({ status: 'success', entry })
      onAdjusted()
    } catch (err: unknown) {
      const message = err instanceof Error && err.message.includes('400')
        ? 'Nothing to remove.'
        : 'Something went wrong.'
      setState({ status: 'error', message })
    }
  }, [mode, onAdjusted])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{mode === 'add' ? 'Add wine' : 'Remove wine'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <BarcodeScanner onScan={handleScan} paused={state.status !== 'scanning'} />

        <div style={{ marginTop: '1rem', minHeight: '2rem' }}>
          {state.status === 'scanning' && (
            <p className="muted">Scan the barcode on the bottle.</p>
          )}
          {state.status === 'loading' && (
            <p className="muted">Updating…</p>
          )}
          {state.status === 'success' && (
            <div>
              <p className="feedback-success" style={{ marginBottom: '0.75rem' }}>
                {mode === 'add' ? 'Added' : 'Removed'} — <strong>{state.entry.barcode}</strong>, now {state.entry.quantity} in stock.
              </p>
              <button type="button" onClick={() => setState({ status: 'scanning' })}>
                Scan another?
              </button>
            </div>
          )}
          {state.status === 'error' && (
            <div>
              <p className="feedback-error" style={{ marginBottom: '0.75rem' }}>{state.message}</p>
              <button type="button" onClick={() => setState({ status: 'scanning' })}>
                Scan another?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
