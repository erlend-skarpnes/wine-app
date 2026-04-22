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
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1rem' }}>{wine?.name ?? name ?? barcode}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {isLoading && <p className="muted">Loading…</p>}

        {!isLoading && !wine && (
          <p className="muted">No details available for this wine yet.</p>
        )}

        {wine && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {wine.imageUrl && (
              <img
                src={wine.imageUrl}
                alt={wine.name}
                style={{ width: 100, height: 'auto', alignSelf: 'center', borderRadius: 4 }}
              />
            )}

            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem', fontSize: '0.875rem' }}>
              {wine.type     && <><dt className="muted">Type</dt>     <dd>{wine.type}</dd></>}
              {wine.winery   && <><dt className="muted">Winery</dt>   <dd>{wine.winery}</dd></>}
              {wine.region   && <><dt className="muted">Region</dt>   <dd>{[wine.region, wine.country].filter(Boolean).join(', ')}</dd></>}
              {!wine.region && wine.country && <><dt className="muted">Country</dt><dd>{wine.country}</dd></>}
              {wine.alcoholContent != null && <><dt className="muted">Alcohol</dt><dd>{wine.alcoholContent}%</dd></>}
              {wine.body     && <><dt className="muted">Body</dt>     <dd>{wine.body}</dd></>}
              {wine.acidity  && <><dt className="muted">Acidity</dt>  <dd>{wine.acidity}</dd></>}
              {wine.storagePotential && <><dt className="muted">Storage</dt><dd>{wine.storagePotential}</dd></>}
            </dl>

            {wine.grapes.length > 0 && (
              <div>
                <p className="muted" style={{ marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>GRAPES</p>
                <p style={{ fontSize: '0.875rem' }}>{wine.grapes.join(', ')}</p>
              </div>
            )}

            {wine.pairings.length > 0 && (
              <div>
                <p className="muted" style={{ marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>FOOD PAIRINGS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {wine.pairings.map(p => (
                    <span key={p} className="badge" style={{ background: 'var(--border)', color: 'var(--text)', fontWeight: 400 }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {wine.description && (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>{wine.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
