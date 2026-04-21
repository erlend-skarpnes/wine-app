import { useState, useCallback, useEffect } from 'react'
import BarcodeScanner from './BarcodeScanner'
import { api } from '../api/client'
import type { CellarEntry, Wine } from '../api/types'

type Mode = 'add' | 'remove'

type ScanState =
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'success'; wine: Wine; quantity: number }
  | { status: 'not_found'; barcode: string }
  | { status: 'error'; message: string }

interface Props {
  mode: Mode
  onClose: () => void
  onAdjusted: () => void
}

export default function ScanModal({ mode, onClose, onAdjusted }: Props) {
  const [state, setState] = useState<ScanState>({ status: 'scanning' })

  // Auto-reset to scanning after feedback
  useEffect(() => {
    if (state.status === 'success' || state.status === 'not_found') {
      const timer = setTimeout(() => setState({ status: 'scanning' }), 1800)
      return () => clearTimeout(timer)
    }
  }, [state.status])

  const handleScan = useCallback(async (barcode: string) => {
    setState({ status: 'loading' })

    try {
      const delta = mode === 'add' ? 1 : -1
      const res = await api.post<{ wine: Wine; cellarEntry: CellarEntry }>('/cellar/adjust', { barcode, delta })
      setState({ status: 'success', wine: res.wine, quantity: res.cellarEntry.quantity })
      onAdjusted()
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('404')) {
        setState({ status: 'not_found', barcode })
      } else {
        setState({ status: 'error', message: 'Something went wrong.' })
      }
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

        <div style={{ marginTop: '1rem', minHeight: '3rem' }}>
          {state.status === 'scanning' && (
            <p className="muted">Scan the barcode on the bottle.</p>
          )}

          {state.status === 'loading' && (
            <p className="muted">Looking up wine…</p>
          )}

          {state.status === 'success' && (
            <p className="feedback-success">
              {mode === 'add' ? 'Added' : 'Removed'} 1 bottle of <strong>{state.wine.name}</strong>.
              Now in stock: {state.quantity}
            </p>
          )}

          {state.status === 'not_found' && (
            <p className="feedback-error">
              No wine found for barcode <strong>{state.barcode}</strong>.
            </p>
          )}

          {state.status === 'error' && (
            <div>
              <p className="feedback-error" style={{ marginBottom: '0.5rem' }}>{state.message}</p>
              <button type="button" className="secondary" onClick={() => setState({ status: 'scanning' })}>
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
