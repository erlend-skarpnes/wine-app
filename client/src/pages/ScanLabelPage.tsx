import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import BarcodeScanner from '../components/BarcodeScanner'
import { api } from '../api/client'
import type { CellarEntry, Wine } from '../api/types'

type State =
  | { status: 'scanning' }
  | { status: 'loading'; barcode: string }
  | { status: 'found'; barcode: string; wine: Wine; cellarEntry: CellarEntry | null; quantity: number }
  | { status: 'not_found'; barcode: string }
  | { status: 'error'; message: string }

export default function ScanPage() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<State>({ status: 'scanning' })

  const handleScan = useCallback(async (barcode: string) => {
    setState({ status: 'loading', barcode })

    try {
      const wine = await api.get<Wine>(`/wines/barcode/${encodeURIComponent(barcode)}`)
      const entry = wine.cellarEntries?.[0] ?? null
      setState({ status: 'found', barcode, wine, cellarEntry: entry, quantity: entry?.quantity ?? 0 })
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('404')) {
        setState({ status: 'not_found', barcode })
      } else {
        setState({ status: 'error', message: 'Something went wrong. Please try again.' })
      }
    }
  }, [])

  async function adjust(delta: 1 | -1) {
    if (state.status !== 'found') return
    const { barcode, wine } = state

    try {
      const res = await api.post<{ wine: Wine; cellarEntry: CellarEntry }>('/cellar/adjust', { barcode, delta })
      setState({ status: 'found', barcode, wine, cellarEntry: res.cellarEntry, quantity: res.cellarEntry.quantity })
      queryClient.invalidateQueries({ queryKey: ['cellar'] })
    } catch {
      setState({ status: 'error', message: 'Failed to update quantity.' })
    }
  }

  function reset() {
    setState({ status: 'scanning' })
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Scan Barcode</h2>

      <BarcodeScanner onScan={handleScan} paused={state.status !== 'scanning'} />

      <div style={{ marginTop: '1.25rem' }}>
        {state.status === 'scanning' && (
          <p className="muted">Point the camera at the barcode on the bottle.</p>
        )}

        {state.status === 'loading' && (
          <p className="muted">Looking up {state.barcode}…</p>
        )}

        {state.status === 'not_found' && (
          <div className="card">
            <p style={{ marginBottom: '0.75rem' }}>
              No wine found for barcode <strong>{state.barcode}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to={`/add?barcode=${encodeURIComponent(state.barcode)}`}>
                <button type="button">Add wine</button>
              </Link>
              <button type="button" className="secondary" onClick={reset}>Scan again</button>
            </div>
          </div>
        )}

        {state.status === 'found' && (
          <div className="card">
            <strong style={{ fontSize: '1.1rem' }}>{state.wine.name}</strong>
            {state.wine.vintage && <span className="muted"> {state.wine.vintage}</span>}
            <p className="muted" style={{ marginTop: '0.2rem' }}>
              {state.wine.winery} &middot; {state.wine.varietal}
            </p>

            <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <button
                type="button"
                onClick={() => adjust(-1)}
                disabled={state.quantity === 0}
                style={{ fontSize: '1.5rem', padding: '0.25rem 1rem', lineHeight: 1 }}
              >
                &minus;
              </button>
              <span style={{ fontSize: '1.5rem', fontWeight: 600, minWidth: '2rem', textAlign: 'center' }}>
                {state.quantity}
              </span>
              <button
                type="button"
                onClick={() => adjust(1)}
                style={{ fontSize: '1.5rem', padding: '0.25rem 1rem', lineHeight: 1 }}
              >
                +
              </button>
              <span className="muted">{state.quantity === 1 ? 'bottle' : 'bottles'}</span>
            </div>

            <button type="button" className="secondary" onClick={reset}>Scan another</button>
          </div>
        )}

        {state.status === 'error' && (
          <div>
            <p className="error">{state.message}</p>
            <button type="button" className="secondary" onClick={reset}>Try again</button>
          </div>
        )}
      </div>
    </div>
  )
}
