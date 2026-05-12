import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, X } from 'lucide-react'
import { getWineData } from '../api/wine'
import { queryKeys } from '../api/queryKeys'
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

function PieChart({ label, raw }: { label: string; raw: string }) {
  const value = parseFloat(raw)
  if (isNaN(value)) return null
  const size = 44
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
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="var(--color-stone)" />
        {fraction >= 1
          ? <circle cx={cx} cy={cy} r={r} fill="var(--color-wine)" />
          : <path d={slicePath} fill="var(--color-wine)" />}
      </svg>
      <span className="text-clay text-[10px] uppercase tracking-wide">{label}</span>
    </div>
  )
}

export default function WineDetailModal({ barcode, name, homeId, quantity: initialQuantity, onAdjusted, onClose }: Props) {
  const [editingStock, setEditingStock] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState(0)
  const [prevEditQuantity, setPrevEditQuantity] = useState(0)

  const { data: locationEntries = [] } = useQuery<LocationEntry[]>({
    queryKey: queryKeys.entryLocations(homeId, barcode),
    queryFn: () => getEntryLocations(homeId, barcode),
  })

  const { data: wine, isLoading } = useQuery({
    queryKey: queryKeys.wine(barcode),
    queryFn: () => getWineData(barcode),
  })

  const totalQuantity = locationEntries.length > 0
    ? locationEntries.reduce((sum, le) => sum + le.quantity, 0)
    : initialQuantity

  const selectedEntry = locationEntries.find(le => le.locationId === selectedLocationId) ?? locationEntries[0]

  const handleAdjust = useCallback(async (delta: 1 | -1) => {
    if (!selectedEntry) return
    try {
      const result = await adjustEntry(homeId, barcode, delta, selectedEntry.locationId ?? undefined, selectedEntry.sectionId ?? undefined)
      setEditQuantity(result.quantity)
      onAdjusted()
    } catch {
      // ignore
    }
  }, [homeId, selectedEntry, barcode, onAdjusted])

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
                {locationEntries.map((le, i) => (
                  <button
                    key={le.locationId ?? `unlocated-${i}`}
                    type="button"
                    onClick={() => selectLocation(le)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedEntry?.locationId === le.locationId
                        ? 'bg-wine text-white border-wine'
                        : 'bg-surface text-clay border-stone hover:bg-warm'
                    }`}
                  >
                    {le.locationName ?? 'Uten plassering'}{le.sectionName ? ` › ${le.sectionName}` : ''}
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
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface w-full sm:max-w-[460px] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-[0_-8px_48px_rgba(0,0,0,0.18)] sm:shadow-[0_8px_48px_rgba(0,0,0,0.22)]"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Header: bottle image left, primary info right */}
        <div className="relative flex flex-shrink-0" style={{ minHeight: '240px' }}>
          {/* Image column */}
          <div className="flex-shrink-0 relative" style={{ width: '120px', background: '#f5efe8' }}>
            {wine?.imageUrl
              ? <WineImage src={wine.imageUrl} alt={wine.name} className="absolute inset-0 w-full h-full object-contain p-3" />
              : <div className="absolute inset-0 flex items-center justify-center select-none" style={{ color: '#e8e0d8', fontSize: '3rem' }}>◇</div>
            }
          </div>

          {/* Info column */}
          <div className="flex-1 px-5 pt-4 pb-4 flex flex-col justify-between min-w-0">
            <div className="flex flex-col gap-3 pr-8">
              <h2
                className="text-bark leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: '1.75rem' }}
              >
                {title}
              </h2>

              {locationEntries.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {locationEntries.map((le, i) => (
                    <span
                      key={le.locationId ?? `unlocated-${i}`}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: 'rgba(114,47,55,0.09)', color: '#722F37', border: '1px solid rgba(114,47,55,0.18)' }}
                    >
                      <MapPin size={10} />
                      {le.locationName ?? 'Uten plassering'}
                      {le.sectionName ? ` › ${le.sectionName}` : ''}
                      {locationEntries.length > 1 ? ` · ${le.quantity}` : ''}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-clay text-sm">
                {totalQuantity} {totalQuantity === 1 ? 'flaske' : 'flasker'} totalt
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            aria-label="Lukk"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(232,224,216,0.9)',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2c1810',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 flex flex-col">
          {isLoading && (
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="flex gap-6 justify-center py-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="shimmer rounded-full" style={{ width: 44, height: 44, animationDelay: `${i * 100}ms` }} />
                    <div className="shimmer rounded-full h-2 w-10" style={{ animationDelay: `${i * 100 + 60}ms` }} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                {(['55%', '72%', '60%', '45%'] as const).map((w, i) => (
                  <div key={i} className="shimmer h-3 rounded-full" style={{ width: w, animationDelay: `${i * 55}ms` }} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && !wine && (
            <p className="px-6 pb-4 text-clay text-sm">Ingen detaljer tilgjengelig for denne vinen ennå.</p>
          )}

          {wine && (
            <>
              <div className="border-t border-stone mx-6" />
              <div className="px-6 py-4 flex flex-col gap-5">

                {(wine.body || wine.acidity || wine.tannins) && (
                  <div className="flex gap-6 justify-center py-1">
                    {wine.body    && <PieChart label="Fylde"        raw={wine.body} />}
                    {wine.acidity && <PieChart label="Friskhet"     raw={wine.acidity} />}
                    {wine.tannins && <PieChart label="Garvestoffer" raw={wine.tannins} />}
                  </div>
                )}

                <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
                  {wine.type     && <><dt className="text-clay">Type</dt>          <dd>{wine.type}</dd></>}
                  {wine.winery   && <><dt className="text-clay">Produsent</dt>     <dd>{wine.winery}</dd></>}
                  {wine.region   && <><dt className="text-clay">Region</dt>        <dd>{[wine.region, wine.country].filter(Boolean).join(', ')}</dd></>}
                  {!wine.region && wine.country && <><dt className="text-clay">Land</dt><dd>{wine.country}</dd></>}
                  {wine.alcoholContent != null && <><dt className="text-clay">Alkohol</dt>   <dd>{wine.alcoholContent}%</dd></>}
                  {wine.storagePotential && <><dt className="text-clay">Lagringsevne</dt><dd>{wine.storagePotential}</dd></>}
                </dl>

                {wine.grapes.length > 0 && (
                  <div>
                    <p className="text-clay text-xs font-semibold mb-2 uppercase tracking-wide">Druer</p>
                    <div className="flex flex-col gap-1">
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

                {wine.pairings.length > 0 && (
                  <div>
                    <p className="text-clay text-xs font-semibold mb-2 uppercase tracking-wide">Passer til</p>
                    <div className="flex flex-wrap gap-1.5">
                      {wine.pairings.map(p => (
                        <span key={p} className="inline-block bg-stone text-bark rounded-full px-2.5 py-0.5 text-xs">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {wine.description && (
                  <p className="text-[0.85rem] text-clay leading-relaxed">{wine.description}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action bar */}
        <div className="border-t border-stone px-6 py-4 flex-shrink-0">
          <button type="button" className="w-full py-3 text-base" onClick={enterEditStock}>
            Rediger beholdning
          </button>
        </div>
      </div>
    </div>
  )
}
