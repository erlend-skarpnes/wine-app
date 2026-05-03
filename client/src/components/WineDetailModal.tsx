import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWineData } from '../api/wine'
import { adjustEntry } from '../api/cellars'
import { useCellar } from '../context/CellarContext'
import Modal from './Modal'
import WineImage from './WineImage'
import QuantityAdjuster from './QuantityAdjuster'

interface Props {
  barcode: string
  name: string | null
  cellarId: number
  cellarQuantities: Map<number, number>
  onAdjusted: () => void
  onClose: () => void
}

export default function WineDetailModal({ barcode, name, cellarId, cellarQuantities, onAdjusted, onClose }: Props) {
  const { cellars } = useCellar()
  const [editingStock, setEditingStock] = useState(false)
  const [selectedCellarId, setSelectedCellarId] = useState(cellarId)
  const initialQuantity = cellarQuantities.get(cellarId) ?? 0
  const [quantity, setQuantity] = useState(initialQuantity)
  const [prevQuantity, setPrevQuantity] = useState(initialQuantity)

  // Cellars where this wine actually exists
  const relevantCellars = cellars.filter(c => cellarQuantities.has(c.id))

  const { data: wine, isLoading } = useQuery({
    queryKey: ['wine', barcode],
    queryFn: () => getWineData(barcode),
  })

  const handleAdjust = useCallback(async (delta: 1 | -1) => {
    try {
      const entry = await adjustEntry(selectedCellarId, barcode, delta)
      setQuantity(entry.quantity)
      onAdjusted()
    } catch {
      // ignore
    }
  }, [selectedCellarId, barcode, onAdjusted])

  const title = wine?.name ?? name ?? barcode

  function ScaleBar({ label, raw }: { label: string; raw: string }) {
    const value = parseFloat(raw)
    if (isNaN(value)) return null
    return (
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-clay text-xs">{label}</span>
        <div className="h-1.5 bg-stone rounded-full overflow-hidden">
          <div className="h-full bg-wine rounded-full" style={{ width: `${(value / 12) * 100}%` }} />
        </div>
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

          {relevantCellars.length > 1 && (
            <div>
              <p className="text-sm font-medium text-bark mb-2">Kjeller:</p>
              <div className="flex flex-wrap gap-2">
                {relevantCellars.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      const q = cellarQuantities.get(c.id) ?? 0
                      setSelectedCellarId(c.id)
                      setQuantity(q)
                      setPrevQuantity(q)
                    }}
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
          )}

          <div className="text-center">
            <p className="text-clay text-[0.85rem]">
              Beholdning: {prevQuantity} → {quantity}
            </p>
          </div>

          <QuantityAdjuster value={quantity} onChange={handleAdjust} />

          <div className="flex gap-2">
            <button type="button" className="flex-1 py-3 text-base" onClick={() => { setPrevQuantity(quantity); setEditingStock(false) }}>
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
          {wine.imageUrl && (
            <WineImage src={wine.imageUrl} alt={wine.name} className="w-24 h-auto self-center rounded" />
          )}

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-clay">Beholdning</dt><dd>{initialQuantity} {initialQuantity === 1 ? 'flaske' : 'flasker'}</dd>
            {wine.type     && <><dt className="text-clay">Type</dt>          <dd>{wine.type}</dd></>}
            {wine.winery   && <><dt className="text-clay">Produsent</dt>     <dd>{wine.winery}</dd></>}
            {wine.region   && <><dt className="text-clay">Region</dt>        <dd>{[wine.region, wine.country].filter(Boolean).join(', ')}</dd></>}
            {!wine.region && wine.country && <><dt className="text-clay">Land</dt><dd>{wine.country}</dd></>}
            {wine.alcoholContent != null && <><dt className="text-clay">Alkohol</dt>   <dd>{wine.alcoholContent}%</dd></>}
            {wine.storagePotential && <><dt className="text-clay">Lagringsevne</dt><dd>{wine.storagePotential}</dd></>}
          </dl>

          {(wine.body || wine.acidity) && (
            <div className="flex gap-4">
              {wine.body    && <ScaleBar label="Fylde"    raw={wine.body} />}
              {wine.acidity && <ScaleBar label="Friskhet" raw={wine.acidity} />}
            </div>
          )}

          {wine.grapes.length > 0 && (
            <div>
              <p className="text-clay text-xs font-semibold mb-1 uppercase tracking-wide">Druer</p>
              <div className="flex flex-col gap-0.5">
                {wine.grapes.map((g, i) => {
                  const parts = g.split(' ')
                  const hasPct = parts.length > 1 && parts[parts.length - 1].endsWith('%')
                  const name = hasPct ? parts.slice(0, -1).join(' ') : g
                  const pct  = hasPct ? parts[parts.length - 1] : null
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{name}</span>
                      {pct && <span className="text-clay">{pct}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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

          {wine.description && (
            <p className="text-[0.85rem] text-clay leading-relaxed">{wine.description}</p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-stone flex gap-2">
        <button type="button" className="flex-1 py-3 text-base" onClick={() => { setPrevQuantity(quantity); setEditingStock(true) }}>
          Rediger beholdning
        </button>
        <button type="button" className="secondary flex-1 py-3 text-base" onClick={onClose}>
          Lukk
        </button>
      </div>
    </Modal>
  )
}
