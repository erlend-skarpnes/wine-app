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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface rounded-lg p-6 w-full max-w-[420px] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[1.1rem] font-semibold">{mode === 'add' ? 'Add wine' : 'Remove wine'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {showCamera && <BarcodeScanner onScan={handleScan} paused={false} />}
        {showLabelCamera && <LabelCamera onCapture={handleCapture} disabled={state.status === 'identifying'} />}

        <div className="mt-4 min-h-8">
          {state.status === 'scanning' && (
            <p className="text-clay text-sm">Scan the barcode on the bottle.</p>
          )}

          {isSpinning && <div className="spinner" />}

          {state.status === 'capture' && (
            <p className="text-clay text-sm">Point the camera at the wine label and capture a photo.</p>
          )}

          {state.status === 'suggestions' && (
            <div>
              <p className="mb-2">Select the correct wine:</p>
              <ul className="list-none p-0 mb-3">
                {state.suggestions.map(s => (
                  <li key={s.id} className="mb-1">
                    <button
                      type="button"
                      className="w-full text-left"
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
            <div className="flex flex-col gap-4">
              {state.imageUrl && (
                <img
                  src={state.imageUrl}
                  alt={state.wineName ?? undefined}
                  className="w-20 h-auto self-center rounded"
                />
              )}

              <div className="text-center">
                <p className="font-semibold mb-1">{state.wineName ?? state.entry.barcode}</p>
                <p className="text-clay text-[0.85rem]">
                  Stock: {state.prevQuantity} → {state.entry.quantity}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleInlineAdjust(-1)}
                  disabled={state.entry.quantity === 0}
                  className="w-10 h-10 p-0 text-xl shrink-0"
                >
                  −
                </button>
                <span className="text-2xl font-bold min-w-8 text-center">
                  {state.entry.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleInlineAdjust(1)}
                  className="w-10 h-10 p-0 text-xl shrink-0"
                >
                  +
                </button>
              </div>

              <div className="flex gap-2">
                <button type="button" className="flex-1 py-3 text-base" onClick={() => setState({ status: 'scanning' })}>
                  Scan another
                </button>
                <button type="button" className="secondary flex-1 py-3 text-base" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div>
              <p className="text-red-600 text-[0.9rem] mb-3">{state.message}</p>
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
