import { useState, useCallback } from 'react'
import BarcodeScanner from './BarcodeScanner'
import LabelCamera from './LabelCamera'
import Modal from './Modal'
import WineImage from './WineImage'
import QuantityAdjuster from './QuantityAdjuster'
import { adjustEntry } from '../api/cellars'
import { getWineData, identifyWine, linkWine } from '../api/wine'
import { useCellar } from '../context/CellarContext'
import type { CellarEntry, WineSuggestion } from '../api/types'

type Mode = 'add' | 'remove'

type ScanState =
  | { status: 'scanning' }
  | { status: 'cellar-pick'; barcode: string }
  | { status: 'loading' }
  | { status: 'success'; entry: CellarEntry; prevQuantity: number; wineName: string | null; imageUrl: string | null }
  | { status: 'error'; message: string }
  | { status: 'capture'; entry: CellarEntry }
  | { status: 'identifying'; entry: CellarEntry }
  | { status: 'suggestions'; entry: CellarEntry; barcode: string; suggestions: WineSuggestion[] }
  | { status: 'linking'; entry: CellarEntry; wineName: string | null }

interface Props {
  mode: Mode
  cellarId: number
  onClose: () => void
  onAdjusted: () => void
}

export default function ScanModal({ mode, cellarId, onClose, onAdjusted }: Props) {
  const { cellars } = useCellar()
  const [selectedCellarId, setSelectedCellarId] = useState(cellarId)
  const [state, setState] = useState<ScanState>({ status: 'scanning' })

  const doAdjust = useCallback(async (barcode: string) => {
    setState({ status: 'loading' })
    try {
      const delta = mode === 'add' ? 1 : -1
      const entry = await adjustEntry(selectedCellarId, barcode, delta)
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
        ? 'Ingenting å fjerne.'
        : 'Noe gikk galt.'
      setState({ status: 'error', message })
    }
  }, [mode, selectedCellarId, onAdjusted])

  const handleScan = useCallback((barcode: string) => {
    if (cellars.length > 1) {
      setState({ status: 'cellar-pick', barcode })
    } else {
      doAdjust(barcode)
    }
  }, [cellars.length, doAdjust])

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
      const entry = await adjustEntry(selectedCellarId, state.entry.barcode, delta)
      onAdjusted()
      setState(prev => prev.status === 'success' ? { ...prev, entry } : prev)
    } catch {
      // ignore — quantity display stays as-is
    }
  }, [state, selectedCellarId, onAdjusted])

  const showCamera = state.status === 'scanning'
  const showLabelCamera = state.status === 'capture' || state.status === 'identifying'
  const isSpinning = state.status === 'loading' || state.status === 'identifying' || state.status === 'linking'

  return (
    <Modal title={mode === 'add' ? 'Legg til vin' : 'Fjern vin'} onClose={onClose}>
      {showCamera && <BarcodeScanner onScan={handleScan} paused={false} />}
      {showLabelCamera && <LabelCamera onCapture={handleCapture} disabled={state.status === 'identifying'} />}

      <div className="mt-4 min-h-8">
        {state.status === 'scanning' && (
          <p className="text-clay text-sm">Skann strekkoden på flasken.</p>
        )}

        {state.status === 'cellar-pick' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-bark mb-2">Velg kjeller:</p>
              <div className="flex flex-wrap gap-2">
                {cellars.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCellarId(c.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedCellarId === c.id
                        ? 'bg-wine text-white border-wine'
                        : 'bg-surface text-clay border-stone hover:bg-warm'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="flex-1" onClick={() => doAdjust(state.barcode)}>
                Bekreft
              </button>
              <button type="button" className="secondary flex-1" onClick={() => setState({ status: 'scanning' })}>
                Skann på nytt
              </button>
            </div>
          </div>
        )}

        {isSpinning && <div className="spinner" />}

        {state.status === 'capture' && (
          <p className="text-clay text-sm">Pek kameraet mot etiketten og ta et bilde.</p>
        )}

        {state.status === 'suggestions' && (
          <div>
            <p className="mb-2">Velg riktig vin:</p>
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
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="secondary"
              onClick={() => setState({ status: 'success', entry: state.entry, prevQuantity: state.entry.quantity - 1, wineName: null, imageUrl: null })}
            >
              Hopp over
            </button>
          </div>
        )}

        {state.status === 'success' && (
          <div className="flex flex-col gap-4">
            {state.imageUrl && (
              <WineImage src={state.imageUrl} alt={state.wineName ?? undefined} />
            )}

            <div className="text-center">
              <p className="font-semibold mb-1">{state.wineName ?? state.entry.barcode}</p>
              <p className="text-clay text-[0.85rem]">
                Beholdning: {state.prevQuantity} → {state.entry.quantity}
              </p>
            </div>

            <QuantityAdjuster
              value={state.entry.quantity}
              onChange={handleInlineAdjust}
            />

            <div className="flex gap-2">
              <button type="button" className="flex-1 py-3 text-base" onClick={() => setState({ status: 'scanning' })}>
                Skann en til
              </button>
              <button type="button" className="secondary flex-1 py-3 text-base" onClick={onClose}>
                Ferdig
              </button>
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <div>
            <p className="text-red-600 text-[0.9rem] mb-3">{state.message}</p>
            <button type="button" onClick={() => setState({ status: 'scanning' })}>
              Prøv igjen
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
