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
  | { status: 'success'; entry: CellarEntry; prevQuantity: number; wineName: string | null; imageUrl: string | null }
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
      const prevQuantity = entry.quantity - delta

      try {
        const wineData = await getWineData(barcode)
        onAdjusted()
        setState({ status: 'success', entry, prevQuantity, wineName: wineData.name, imageUrl: wineData.imageUrl })
      } catch {
        onAdjusted()
        if (mode === 'add') {
          setState({ status: 'capture', entry })
        } else {
          setState({ status: 'success', entry, prevQuantity, wineName: null, imageUrl: null })
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
      const prevQuantity = entry.quantity - 1
      if (result.status === 'identified') {
        setState({ status: 'success', entry, prevQuantity, wineName: result.wineData.name, imageUrl: result.wineData.imageUrl })
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
    const prevQuantity = entry.quantity - 1
    setState({ status: 'linking', entry, wineName: suggestion.name })
    try {
      const wineData = await linkWine(barcode, suggestion.id)
      setState({ status: 'success', entry, prevQuantity, wineName: wineData.name, imageUrl: wineData.imageUrl })
    } catch {
      setState({ status: 'success', entry, prevQuantity, wineName: suggestion.name, imageUrl: null })
    }
  }, [state])

  const handleInlineAdjust = useCallback(async (delta: 1 | -1) => {
    if (state.status !== 'success') return
    try {
      const entry = await api.post<CellarEntry>('/cellar/adjust', { barcode: state.entry.barcode, delta })
      onAdjusted()
      setState(prev => prev.status === 'success' ? { ...prev, entry } : prev)
    } catch {
      // ignore — quantity display stays as-is
    }
  }, [state, onAdjusted])

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
                onClick={() => setState({ status: 'success', entry: state.entry, prevQuantity: state.entry.quantity - 1, wineName: null, imageUrl: null })}
              >
                Skip
              </button>
            </div>
          )}

          {state.status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {state.imageUrl && (
                <img
                  src={state.imageUrl}
                  alt={state.wineName ?? undefined}
                  style={{ width: 80, height: 'auto', alignSelf: 'center', borderRadius: 4 }}
                />
              )}

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {state.wineName ?? state.entry.barcode}
                </p>
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  Stock: {state.prevQuantity} → {state.entry.quantity}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => handleInlineAdjust(-1)}
                  disabled={state.entry.quantity === 0}
                  style={{ width: '2.5rem', height: '2.5rem', padding: 0, fontSize: '1.25rem', flexShrink: 0 }}
                >
                  −
                </button>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: '2rem', textAlign: 'center' }}>
                  {state.entry.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleInlineAdjust(1)}
                  style={{ width: '2.5rem', height: '2.5rem', padding: 0, fontSize: '1.25rem', flexShrink: 0 }}
                >
                  +
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setState({ status: 'scanning' })} style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}>
                  Scan another
                </button>
                <button type="button" className="secondary" onClick={onClose} style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}>
                  Done
                </button>
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div>
              <p className="feedback-error" style={{ marginBottom: '0.75rem' }}>{state.message}</p>
              <button type="button" onClick={() => setState({ status: 'scanning' })}>
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
