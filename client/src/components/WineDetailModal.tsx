import { useQuery } from '@tanstack/react-query'
import { getWineData } from '../api/wine'

interface Props {
  barcode: string
  name: string | null
  onClose: () => void
}

export default function WineDetailModal({ barcode, name, onClose }: Props) {
  const { data: wine, isLoading } = useQuery({
    queryKey: ['wine', barcode],
    queryFn: () => getWineData(barcode),
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface rounded-lg p-6 w-full max-w-[480px] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold">{wine?.name ?? name ?? barcode}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {isLoading && <p className="text-clay text-sm">Laster…</p>}

        {!isLoading && !wine && (
          <p className="text-clay text-sm">Ingen detaljer tilgjengelig for denne vinen ennå.</p>
        )}

        {wine && (
          <div className="flex flex-col gap-4">
            {wine.imageUrl && (
              <img
                src={wine.imageUrl}
                alt={wine.name}
                className="w-24 h-auto self-center rounded"
              />
            )}

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
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
      </div>
    </div>
  )
}
