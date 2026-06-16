import { useReducer, useCallback, useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScanBarcode, RotateCcw, ChevronsRight, Camera } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'
import LabelCamera from './LabelCamera'
import Modal from './Modal'
import WineImage from './WineImage'
import QuantityAdjuster from './QuantityAdjuster'
import { adjustEntry, getLocations } from '../api/locations'
import { queryKeys } from '../api/queryKeys'
import { identifyWine, linkWine } from '../api/wine'
import { submitSample } from '../api/samples'
import { scanReducer, initialScanState } from './scanReducer'
import { useScanAdjust } from '../hooks/useScanAdjust'
import type { Location, WineSuggestion } from '../api/types'

type Mode = 'add' | 'remove'

interface Props {
  mode: Mode
  homeId: number
  onClose: () => void
  onAdjusted: () => void
}

export default function ScanModal({ mode, homeId, onClose, onAdjusted }: Props) {
  const [state, dispatch] = useReducer(scanReducer, initialScanState)
  const [sampleDone, setSampleDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.status === 'scanning') setSampleDone(false)
  }, [state.status])

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: queryKeys.locations(homeId),
    queryFn: () => getLocations(homeId),
  })

  const doAdjust = useScanAdjust(dispatch, homeId, mode, onAdjusted)

  const handleScan = useCallback((barcode: string) => {
    if (locationsLoading) return
    if (locations.length === 0) {
      doAdjust(barcode)
    } else {
      const first = locations[0]
      if (locations.length === 1 && first.sections.length === 0) {
        doAdjust(barcode, first.id)
      } else if (locations.length === 1 && first.sections.length > 0) {
        dispatch({ type: 'GO_TO_SECTION_PICK', barcode, locationId: first.id })
      } else {
        dispatch({ type: 'GO_TO_LOCATION_PICK', barcode, selectedLocationId: first.id })
      }
    }
  }, [locations, locationsLoading, doAdjust])

  const handleCapture = useCallback(async (blob: Blob) => {
    if (state.status !== 'capture') return
    const { barcode } = state
    dispatch({ type: 'IDENTIFY_START' })
    try {
      const result = await identifyWine(barcode, blob)
      if (result.status === 'identified') {
        dispatch({ type: 'IDENTIFIED', wineName: result.wineData.name, imageUrl: result.wineData.imageUrl })
      } else {
        dispatch({ type: 'SUGGESTIONS', suggestions: result.suggestions })
      }
    } catch {
      dispatch({ type: 'IDENTIFY_FAILED' })
    }
  }, [state])

  const handleSelectSuggestion = useCallback(async (suggestion: WineSuggestion) => {
    if (state.status !== 'suggestions') return
    const { barcode } = state
    dispatch({ type: 'LINK_START', wineName: suggestion.name })
    try {
      const wineData = await linkWine(barcode, suggestion.id)
      dispatch({ type: 'LINKED', wineName: wineData.name, imageUrl: wineData.imageUrl })
    } catch {
      dispatch({ type: 'LINKED', wineName: suggestion.name, imageUrl: null })
    }
  }, [state])

  const handleSampleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || state.status !== 'success') return
    e.target.value = ''
    try {
      await submitSample(state.barcode, file)
    } catch {
      // fire-and-forget
    }
    setSampleDone(true)
  }, [state])

  const handleInlineAdjust = useCallback(async (delta: 1 | -1) => {
    if (state.status !== 'success') return
    try {
      const result = await adjustEntry(homeId, state.barcode, delta, state.locationId ?? undefined)
      onAdjusted()
      dispatch({ type: 'INLINE_ADJUST_SUCCESS', quantity: result.quantity })
    } catch {
      // ignore — quantity display stays as-is
    }
  }, [homeId, state, onAdjusted])

  const confirmLocationPick = useCallback(() => {
    if (state.status !== 'location-pick') return
    const { barcode, selectedLocationId } = state
    const loc = locations.find(l => l.id === selectedLocationId)
    if (loc && loc.sections.length > 0) {
      dispatch({ type: 'GO_TO_SECTION_PICK', barcode, locationId: selectedLocationId })
    } else {
      doAdjust(barcode, selectedLocationId ?? undefined)
    }
  }, [state, locations, doAdjust])

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
                    onClick={() => dispatch({ type: 'PICK_LOCATION', locationId: loc.id })}
                    className={pickerBtn(state.selectedLocationId === loc.id)}
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
              <button type="button" className="secondary flex-1" onClick={() => dispatch({ type: 'RESET' })}>
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
                  onClick={() => dispatch({ type: 'PICK_SECTION', sectionId: null })}
                  className={pickerBtn(state.selectedSectionId === null)}
                >
                  Ingen seksjon
                </button>
                {locations.find(l => l.id === state.locationId)?.sections.map(sec => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => dispatch({ type: 'PICK_SECTION', sectionId: sec.id })}
                    className={pickerBtn(state.selectedSectionId === sec.id)}
                  >
                    {sec.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="flex-1" onClick={() => doAdjust(state.barcode, state.locationId, state.selectedSectionId ?? undefined)}>
                Bekreft
              </button>
              <button type="button" className="secondary flex-1" onClick={() => dispatch({ type: 'RESET' })}>
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
              onClick={() => dispatch({ type: 'SKIP_IDENTIFY' })}
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
              <button type="button" className="flex-1 py-3 text-base flex items-center justify-center gap-2" onClick={() => dispatch({ type: 'RESET' })}>
                <ScanBarcode size={18} /> Skann en til
              </button>
              <button type="button" className="secondary flex-1 py-3 text-base" onClick={onClose}>
                Ferdig
              </button>
            </div>
            {state.sampleEligible && (
              <div className="border-t border-stone pt-3">
                {sampleDone ? (
                  <p className="text-sm text-clay text-center">Takk! 👍</p>
                ) : (
                  <>
                    <button
                      type="button"
                      className="secondary w-full flex items-center justify-center gap-1.5 text-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={16} /> Hjelp oss forbedre vingjenkjenning
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleSampleFile}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {state.status === 'error' && (
          <div>
            <p className="text-red-600 text-[0.9rem] mb-3">{state.message}</p>
            <button type="button" className="flex items-center gap-2" onClick={() => dispatch({ type: 'RESET' })}>
              <RotateCcw size={18} /> Prøv igjen
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
