import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScanBarcode, RotateCcw, ChevronsRight } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'
import LabelCamera from './LabelCamera'
import Modal from './Modal'
import WineImage from './WineImage'
import QuantityAdjuster from './QuantityAdjuster'
import { adjustEntry, getLocations } from '../api/locations'
import { getWineData, identifyWine, linkWine } from '../api/wine'
import type { Location, WineSuggestion } from '../api/types'

type Mode = 'add' | 'remove'

type ScanState =
  | { status: 'scanning' }
  | { status: 'location-pick'; barcode: string }
  | { status: 'section-pick'; barcode: string; locationId: number }
  | { status: 'loading' }
  | { status: 'success'; barcode: string; locationId: number; quantity: number; prevQuantity: number; wineName: string | null; imageUrl: string | null }
  | { status: 'error'; message: string }
  | { status: 'capture'; barcode: string; locationId: number; quantity: number }
  | { status: 'identifying'; barcode: string; locationId: number; quantity: number }
  | { status: 'suggestions'; barcode: string; locationId: number; quantity: number; suggestions: WineSuggestion[] }
  | { status: 'linking'; barcode: string; locationId: number; wineName: string | null }

interface Props {
  mode: Mode
  homeId: number
  onClose: () => void
  onAdjusted: () => void
}

export default function ScanModal({ mode, homeId, onClose, onAdjusted }: Props) {
  const [state, setState] = useState<ScanState>({ status: 'scanning' })
  const [pendingLocationId, setPendingLocationId] = useState<number | null>(null)
  const [pendingSectionId, setPendingSectionId] = useState<number | null>(null)

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ['locations', homeId],
    queryFn: () => getLocations(homeId),
  })

  const doAdjust = useCallback(async (barcode: string, locationId: number, sectionId?: number) => {
    setState({ status: 'loading' })
    try {
      const delta = mode === 'add' ? 1 : -1
      const result = await adjustEntry(locationId, barcode, delta, sectionId)
      const prevQuantity = result.quantity - delta
      try {
        const wineData = await getWineData(barcode)
        onAdjusted()
        setState({ status: 'success', barcode, locationId, quantity: result.quantity, prevQuantity, wineName: wineData.name, imageUrl: wineData.imageUrl })
      } catch {
        onAdjusted()
        if (mode === 'add') {
          setState({ status: 'capture', barcode, locationId, quantity: result.quantity })
        } else {
          setState({ status: 'success', barcode, locationId, quantity: result.quantity, prevQuantity, wineName: null, imageUrl: null })
        }
      }
    } catch (err) {
      const message = err instanceof Error && err.message.includes('400')
        ? 'Ingenting å fjerne.'
        : 'Noe gikk galt.'
      setState({ status: 'error', message })
    }
  }, [mode, onAdjusted])

  const handleScan = useCallback((barcode: string) => {
    if (locationsLoading) return
    if (locations.length === 0) {
      setState({ status: 'error', message: 'Ingen plasseringer funnet.' })
      return
    }

    const first = locations[0]
    setPendingLocationId(first.id)
    setPendingSectionId(null)

    if (locations.length === 1 && first.sections.length === 0) {
      doAdjust(barcode, first.id)
    } else if (locations.length === 1 && first.sections.length > 0) {
      setState({ status: 'section-pick', barcode, locationId: first.id })
    } else {
      setState({ status: 'location-pick', barcode })
    }
  }, [locations, locationsLoading, doAdjust])

  const handleCapture = useCallback(async (blob: Blob) => {
    if (state.status !== 'capture') return
    const { barcode, locationId, quantity } = state
    setState({ status: 'identifying', barcode, locationId, quantity })
    try {
      const result = await identifyWine(barcode, blob)
      const prevQuantity = quantity - 1
      if (result.status === 'identified') {
        setState({ status: 'success', barcode, locationId, quantity, prevQuantity, wineName: result.wineData.name, imageUrl: result.wineData.imageUrl })
      } else {
        setState({ status: 'suggestions', barcode, locationId, quantity, suggestions: result.suggestions })
      }
    } catch {
      setState({ status: 'capture', barcode, locationId, quantity })
    }
  }, [state])

  const handleSelectSuggestion = useCallback(async (suggestion: WineSuggestion) => {
    if (state.status !== 'suggestions') return
    const { barcode, locationId, quantity } = state
    const prevQuantity = quantity - 1
    setState({ status: 'linking', barcode, locationId, wineName: suggestion.name })
    try {
      const wineData = await linkWine(barcode, suggestion.id)
      setState({ status: 'success', barcode, locationId, quantity, prevQuantity, wineName: wineData.name, imageUrl: wineData.imageUrl })
    } catch {
      setState({ status: 'success', barcode, locationId, quantity, prevQuantity, wineName: suggestion.name, imageUrl: null })
    }
  }, [state])

  const handleInlineAdjust = useCallback(async (delta: 1 | -1) => {
    if (state.status !== 'success') return
    try {
      const result = await adjustEntry(state.locationId, state.barcode, delta)
      onAdjusted()
      setState(prev => prev.status === 'success' ? { ...prev, quantity: result.quantity } : prev)
    } catch {
      // ignore — quantity display stays as-is
    }
  }, [state, onAdjusted])

  const confirmLocationPick = useCallback(() => {
    if (state.status !== 'location-pick' || pendingLocationId === null) return
    const loc = locations.find(l => l.id === pendingLocationId)
    if (loc && loc.sections.length > 0) {
      setState({ status: 'section-pick', barcode: state.barcode, locationId: pendingLocationId })
    } else {
      doAdjust(state.barcode, pendingLocationId)
    }
  }, [state, pendingLocationId, locations, doAdjust])

  const showCamera = state.status === 'scanning'
  const showLabelCamera = state.status === 'capture' || state.status === 'identifying'
  const isSpinning = state.status === 'loading' || state.status === 'identifying' || state.status === 'linking'

  const pickerBtn = (active: boolean) =>
    `px-3 py-1.5 text-sm rounded-lg border transition-colors ${
      active ? 'bg-wine text-white border-wine' : 'bg-surface text-clay border-stone hover:bg-warm'
    }`

  return (
    <Modal title={mode === 'add' ? 'Legg til vin' : 'Fjern vin'} onClose={onClose}>
      {showCamera && <BarcodeScanner onScan={handleScan} paused={false} />}
      {showLabelCamera && <LabelCamera onCapture={handleCapture} disabled={state.status === 'identifying'} />}

      <div className="mt-4 min-h-8">
        {state.status === 'scanning' && (
          <p className="text-clay text-sm">
            {locationsLoading ? 'Laster plasseringer…' : 'Skann strekkoden på flasken.'}
          </p>
        )}

        {state.status === 'location-pick' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-bark mb-2">Velg plassering:</p>
              <div className="flex flex-wrap gap-2">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setPendingLocationId(loc.id)}
                    className={pickerBtn(pendingLocationId === loc.id)}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="flex-1" onClick={confirmLocationPick}>
                Bekreft
              </button>
              <button type="button" className="secondary flex-1" onClick={() => setState({ status: 'scanning' })}>
                Skann på nytt
              </button>
            </div>
          </div>
        )}

        {state.status === 'section-pick' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-bark mb-2">Velg seksjon (valgfritt):</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPendingSectionId(null)}
                  className={pickerBtn(pendingSectionId === null)}
                >
                  Ingen seksjon
                </button>
                {locations.find(l => l.id === state.locationId)?.sections.map(sec => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setPendingSectionId(sec.id)}
                    className={pickerBtn(pendingSectionId === sec.id)}
                  >
                    {sec.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="flex-1" onClick={() => doAdjust(state.barcode, state.locationId, pendingSectionId ?? undefined)}>
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
                  <button type="button" className="w-full text-left" onClick={() => handleSelectSuggestion(s)}>
                    <strong>{s.name}</strong>
                    {s.winery && ` — ${s.winery}`}
                    {s.region && `, ${s.region}`}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="secondary flex items-center gap-1.5"
              onClick={() => setState({ status: 'success', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity, prevQuantity: state.quantity - 1, wineName: null, imageUrl: null })}
            >
              <ChevronsRight size={16} /> Hopp over
            </button>
          </div>
        )}

        {state.status === 'success' && (
          <div className="flex flex-col gap-4">
            {state.imageUrl && (
              <WineImage src={state.imageUrl} alt={state.wineName ?? undefined} />
            )}
            <div className="text-center">
              <p className="font-semibold mb-1">{state.wineName ?? state.barcode}</p>
              <p className="text-clay text-[0.85rem]">
                Beholdning: {state.prevQuantity} → {state.quantity}
              </p>
            </div>
            <QuantityAdjuster value={state.quantity} onChange={handleInlineAdjust} />
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-3 text-base flex items-center justify-center gap-2" onClick={() => setState({ status: 'scanning' })}>
                <ScanBarcode size={18} /> Skann en til
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
            <button type="button" className="flex items-center gap-2" onClick={() => setState({ status: 'scanning' })}>
              <RotateCcw size={18} /> Prøv igjen
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
