import { useState, useCallback } from 'react'
import BarcodeScanner from './BarcodeScanner'
import LabelCamera from './LabelCamera'
import { api } from '../api/client'
import { getWineData, identifyWine, linkWine } from '../api/wine'
import type { CellarEntry, WineSuggestion } from '../api/types'

type Mode = 'add' | 'remove'

type ScanState =
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'success'; entry: CellarEntry; wineName: string | null }
  | { status: 'error'; message: string }
  | { status: 'capture'; entry: CellarEntry }
  | { status: 'identifying'; entry: CellarEntry }
  | { status: 'suggestions'; entry: CellarEntry; barcode: string; suggestions: WineSuggestion[] }
  | { status: 'linking'; entry: CellarEntry; wineName: string | null }

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

      try {
        const wineData = await getWineData(barcode)
        onAdjusted()
        setState({ status: 'success', entry, wineName: wineData.name })
      } catch {
        onAdjusted()
        if (mode === 'add') {
          setState({ status: 'capture', entry })
        } else {
          setState({ status: 'success', entry, wineName: null })
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error && err.message.includes('400')
        ? 'Nothing to remove.'
        : 'Something went wrong.'
      setState({ status: 'error', message })
    }
  }, [mode, onAdjusted])

  const handleCapture = useCallback(async (blob: Blob) => {
    if (state.status !== 'capture') return
    const { entry } = state
    setState({ status: 'identifying', entry })
    try {
      const result = await identifyWine(entry.barcode, blob)
      if (result.status === 'identified') {
        setState({ status: 'success', entry, wineName: result.wineData.name })
      } else {
        setState({ status: 'suggestions', entry, barcode: entry.barcode, suggestions: result.suggestions })
      }
    } catch {
      setState({ status: 'capture', entry })
    }
  }, [state])

  const handleSelectSuggestion = useCallback(async (suggestion: WineSuggestion) => {
    if (state.status !== 'suggestions') return
    const { entry, barcode } = state
    setState({ status: 'linking', entry, wineName: suggestion.name })
    try {
      await linkWine(barcode, suggestion.id)
    } catch {
      // link failed — proceed to success anyway
    }
    setState({ status: 'success', entry, wineName: suggestion.name })
  }, [state])

  const showCamera = state.status === 'scanning'
  const showLabelCamera = state.status === 'capture' || state.status === 'identifying'
  const isSpinning = state.status === 'loading' || state.status === 'identifying' || state.status === 'linking'

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{mode === 'add' ? 'Add wine' : 'Remove wine'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {showCamera && <BarcodeScanner onScan={handleScan} paused={false} />}
        {showLabelCamera && <LabelCamera onCapture={handleCapture} disabled={state.status === 'identifying'} />}

        <div style={{ marginTop: '1rem', minHeight: '2rem' }}>
          {state.status === 'scanning' && (
            <p className="muted">Scan the barcode on the bottle.</p>
          )}

          {isSpinning && <div className="spinner" />}

          {state.status === 'capture' && (
            <p className="muted">Point the camera at the wine label and capture a photo.</p>
          )}

          {state.status === 'suggestions' && (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>Select the correct wine:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem' }}>
                {state.suggestions.map(s => (
                  <li key={s.id} style={{ marginBottom: '0.25rem' }}>
                    <button
                      type="button"
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <strong>{s.name}</strong>
                      {s.winery && ` — ${s.winery}`}
                      {s.region && `, ${s.region}`}
                      {s.averageRating != null && ` (${s.averageRating.toFixed(1)})`}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="secondary"
                onClick={() => setState({ status: 'success', entry: state.entry, wineName: null })}
              >
                Skip
              </button>
            </div>
          )}

          {state.status === 'success' && (
            <div>
              <p className="feedback-success" style={{ marginBottom: '0.75rem' }}>
                {mode === 'add' ? 'Added' : 'Removed'} —{' '}
                <strong>{state.wineName ?? state.entry.barcode}</strong>,{' '}
                now {state.entry.quantity} in stock.
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
