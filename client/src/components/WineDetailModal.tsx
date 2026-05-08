import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWineData } from '../api/wine'
import { adjustEntry, getEntryLocations } from '../api/locations'
import Modal from './Modal'
import WineImage from './WineImage'
import QuantityAdjuster from './QuantityAdjuster'
import type { LocationEntry } from '../api/types'

interface Props {
  barcode: string
  name: string | null
  homeId: number
  quantity: number
  onAdjusted: () => void
  onClose: () => void
}

export default function WineDetailModal({ barcode, name, homeId, quantity: initialQuantity, onAdjusted, onClose }: Props) {
  const [editingStock, setEditingStock] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState(0)
  const [prevEditQuantity, setPrevEditQuantity] = useState(0)

  const { data: locationEntries = [] } = useQuery<LocationEntry[]>({
    queryKey: ['entry-locations', homeId, barcode],
    queryFn: () => getEntryLocations(homeId, barcode),
  })

  const { data: wine, isLoading } = useQuery({
    queryKey: ['wine', barcode],
    queryFn: () => getWineData(barcode),
  })

  const totalQuantity = locationEntries.length > 0
    ? locationEntries.reduce((sum, le) => sum + le.quantity, 0)
    : initialQuantity

  const selectedEntry = locationEntries.find(le => le.locationId === selectedLocationId) ?? locationEntries[0]

  const handleAdjust = useCallback(async (delta: 1 | -1) => {
    if (!selectedEntry) return
    try {
      const result = await adjustEntry(selectedEntry.locationId, barcode, delta, selectedEntry.sectionId ?? undefined)
      setEditQuantity(result.quantity)
      onAdjusted()
    } catch {
      // ignore
    }
  }, [selectedEntry, barcode, onAdjusted])

  function enterEditStock() {
    const first = locationEntries[0]
    if (first) {
      setSelectedLocationId(first.locationId)
      setEditQuantity(first.quantity)
      setPrevEditQuantity(first.quantity)
    }
    setEditingStock(true)
  }

  function selectLocation(le: LocationEntry) {
    setSelectedLocationId(le.locationId)
    setEditQuantity(le.quantity)
    setPrevEditQuantity(le.quantity)
  }

  const title = wine?.name ?? name ?? barcode

  function PieChart({ label, raw }: { label: string; raw: string }) {
    const value = parseFloat(raw)
    if (isNaN(value)) return null
    const size = 40
    const cx = size / 2
    const cy = size / 2
    const r = size / 2 - 2
    const fraction = Math.min(value / 12, 1)
    const angle = fraction * 2 * Math.PI
    const x = cx + r * Math.sin(angle)
    const y = cy - r * Math.cos(angle)
    const largeArc = fraction > 0.5 ? 1 : 0
    const slicePath = fraction >= 1
      ? undefined
      : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`
    return (
      <div className="flex flex-col items-center gap-1">
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="var(--color-stone)" />
          {fraction >= 1
            ? <circle cx={cx} cy={cy} r={r} fill="var(--color-wine)" />
            : <path d={slicePath} fill="var(--color-wine)" />}
        </svg>
        <span className="text-clay text-[10px]">{label}</span>
      </div>
    )
  }

  if (editingStock) {
    return (
      <Modal title={title} onClose={onClose} maxWidth="max-w-[480px]">
        <div className="flex flex-col gap-4">
          {wine?.imageUrl && (
            <WineImage src={wine.imageUrl} alt={wine.name} className="w-24 h-auto self-center rounded" />
          )}

          {locationEntries.length > 1 && (
            <div>
              <p className="text-sm font-medium text-bark mb-2">Plassering:</p>
              <div className="flex flex-wrap gap-2">
                {locationEntries.map(le => (
                  <button
                    key={le.locationId}
                    type="button"
                    onClick={() => selectLocation(le)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedEntry?.locationId === le.locationId
                        ? 'bg-wine text-white border-wine'
                        : 'bg-surface text-clay border-stone hover:bg-warm'
                    }`}
                  >
                    {le.locationName}{le.sectionName ? ` › ${le.sectionName}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-clay text-[0.85rem]">
              Beholdning: {prevEditQuantity} → {editQuantity}
            </p>
          </div>

          <QuantityAdjuster value={editQuantity} onChange={handleAdjust} />

          <div className="flex gap-2">
            <button type="button" className="flex-1 py-3 text-base" onClick={() => { setPrevEditQuantity(editQuantity); setEditingStock(false) }}>
              Tilbake
            </button>
            <button type="button" className="secondary flex-1 py-3 text-base" onClick={onClose}>
              Ferdig
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-[480px]">
      {isLoading && <p className="text-clay text-sm">Laster…</p>}

      {!isLoading && !wine && (
        <p className="text-clay text-sm">Ingen detaljer tilgjengelig for denne vinen ennå.</p>
      )}

      {wine && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              {wine.imageUrl && (
                <WineImage src={wine.imageUrl} alt={wine.name} className="w-24 h-auto rounded" />
              )}
              {(wine.body || wine.acidity || wine.tannins) && (
                <div className="grid grid-cols-3">
                  {wine.body    && <PieChart label="Fylde"        raw={wine.body} />}
                  {wine.acidity && <PieChart label="Friskhet"     raw={wine.acidity} />}
                  {wine.tannins && <PieChart label="Garvestoffer" raw={wine.tannins} />}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-clay">Beholdning</dt><dd>{totalQuantity} {totalQuantity === 1 ? 'flaske' : 'flasker'}</dd>
                {wine.type     && <><dt className="text-clay">Type</dt>          <dd>{wine.type}</dd></>}
                {wine.winery   && <><dt className="text-clay">Produsent</dt>     <dd>{wine.winery}</dd></>}
                {wine.region   && <><dt className="text-clay">Region</dt>        <dd>{[wine.region, wine.country].filter(Boolean).join(', ')}</dd></>}
                {!wine.region && wine.country && <><dt className="text-clay">Land</dt><dd>{wine.country}</dd></>}
                {wine.alcoholContent != null && <><dt className="text-clay">Alkohol</dt>   <dd>{wine.alcoholContent}%</dd></>}
                {wine.storagePotential && <><dt className="text-clay">Lagringsevne</dt><dd>{wine.storagePotential}</dd></>}
              </dl>

              {wine.grapes.length > 0 && (
                <div>
                  <p className="text-clay text-xs font-semibold mb-1 uppercase tracking-wide">Druer</p>
                  <div className="flex flex-col gap-0.5">
                    {wine.grapes.map((g, i) => {
                      const parts = g.split(' ')
                      const hasPct = parts.length > 1 && parts[parts.length - 1].endsWith('%')
                      const gname = hasPct ? parts.slice(0, -1).join(' ') : g
                      const pct   = hasPct ? parts[parts.length - 1] : null
                      return (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{gname}</span>
                          {pct && <span className="text-clay">{pct}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {wine.description && (
                <p className="text-[0.85rem] text-clay leading-relaxed">{wine.description}</p>
              )}
            </div>
          </div>

          {wine.pairings.length > 0 && (
            <div>
              <p className="text-clay text-xs font-semibold mb-1.5 uppercase tracking-wide">Passer til</p>
              <div className="flex flex-wrap gap-1.5">
                {wine.pairings.map(p => (
                  <span key={p} className="inline-block bg-stone text-bark rounded-full px-2.5 py-0.5 text-xs">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-stone flex gap-2">
        <button type="button" className="flex-1 py-3 text-base" onClick={enterEditStock}>
          Rediger beholdning
        </button>
        <button type="button" className="secondary flex-1 py-3 text-base" onClick={onClose}>
          Lukk
        </button>
      </div>
    </Modal>
  )
}
