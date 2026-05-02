import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWineData } from '../api/wine'
import { adjustEntry } from '../api/cellars'
import Modal from './Modal'
import WineImage from './WineImage'
import QuantityAdjuster from './QuantityAdjuster'

interface Props {
  barcode: string
  name: string | null
  quantity: number
  cellarId: number
  onAdjusted: () => void
  onClose: () => void
}

export default function WineDetailModal({ barcode, name, quantity: initialQuantity, cellarId, onAdjusted, onClose }: Props) {
  const [editingStock, setEditingStock] = useState(false)
  const [quantity, setQuantity] = useState(initialQuantity)
  const [prevQuantity, setPrevQuantity] = useState(initialQuantity)

  const { data: wine, isLoading } = useQuery({
    queryKey: ['wine', barcode],
    queryFn: () => getWineData(barcode),
  })

  const handleAdjust = useCallback(async (delta: 1 | -1) => {
    try {
      const entry = await adjustEntry(cellarId, barcode, delta)
      setQuantity(entry.quantity)
      onAdjusted()
    } catch {
      // ignore
    }
  }, [cellarId, barcode, onAdjusted])

  const title = wine?.name ?? name ?? barcode

  if (editingStock) {
    return (
      <Modal title={title} onClose={onClose} maxWidth="max-w-[480px]">
        <div className="flex flex-col gap-4">
          {wine?.imageUrl && (
            <WineImage src={wine.imageUrl} alt={wine.name} className="w-24 h-auto self-center rounded" />
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
            <dt className="text-clay">Beholdning</dt><dd>{quantity} {quantity === 1 ? 'flaske' : 'flasker'}</dd>
            {wine.type     && <><dt className="text-clay">Type</dt>          <dd>{wine.type}</dd></>}
            {wine.winery   && <><dt className="text-clay">Produsent</dt>     <dd>{wine.winery}</dd></>}
            {wine.region   && <><dt className="text-clay">Region</dt>        <dd>{[wine.region, wine.country].filter(Boolean).join(', ')}</dd></>}
            {!wine.region && wine.country && <><dt className="text-clay">Land</dt><dd>{wine.country}</dd></>}
            {wine.alcoholContent != null && <><dt className="text-clay">Alkohol</dt>   <dd>{wine.alcoholContent}%</dd></>}
            {wine.body     && <><dt className="text-clay">Fylde</dt>         <dd>{wine.body}</dd></>}
            {wine.acidity  && <><dt className="text-clay">Friskhet</dt>      <dd>{wine.acidity}</dd></>}
            {wine.storagePotential && <><dt className="text-clay">Lagringsevne</dt><dd>{wine.storagePotential}</dd></>}
          </dl>

          {wine.grapes.length > 0 && (
            <div>
              <p className="text-clay text-xs font-semibold mb-1 uppercase tracking-wide">Druer</p>
              <p className="text-sm">{wine.grapes.join(', ')}</p>
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
