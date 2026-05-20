import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, X, Star } from 'lucide-react'
import { getWineData } from '../api/wine'
import { queryKeys } from '../api/queryKeys'
import { adjustEntry, getEntryLocations } from '../api/locations'
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites'
import Modal from './Modal'
import WineImage from './WineImage'
import QuantityAdjuster from './QuantityAdjuster'
import NotesPanel from './NotesPanel'
import type { LocationEntry } from '../api/types'

interface Props {
  barcode: string
  name: string | null
  homeId?: number
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
  const queryClient = useQueryClient()
  const [editState, setEditState] = useState<{ location: LocationEntry; editQuantity: number } | null>(null)
  const [activeTab, setActiveTab] = useState<'oversikt' | 'smak' | 'notater'>('oversikt')

  const { data: favorites = [] } = useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: getFavorites,
  })
  const isFavorite = favorites.some(f => f.barcode === barcode)

  const toggleFavorite = useMutation({
    mutationFn: () => isFavorite ? removeFavorite(barcode) : addFavorite(barcode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites() }),
  })

  const { data: locationEntries = [] } = useQuery<LocationEntry[]>({
    queryKey: queryKeys.entryLocations(homeId ?? 0, barcode),
    queryFn: () => getEntryLocations(homeId!, barcode),
    enabled: !!homeId,
  })

  const { data: wine, isLoading, isError } = useQuery({
    queryKey: queryKeys.wine(barcode),
    queryFn: () => getWineData(barcode),
  })

  const totalQuantity = locationEntries.length > 0
    ? locationEntries.reduce((sum, le) => sum + le.quantity, 0)
    : initialQuantity

  const handleAdjust = useCallback(async (delta: 1 | -1) => {
    if (!editState) return
    try {
      const result = await adjustEntry(homeId!, barcode, delta, editState.location.locationId ?? undefined, editState.location.sectionId ?? undefined)
      setEditState(s => s ? { ...s, editQuantity: result.quantity } : null)
      onAdjusted()
    } catch {
      // ignore
    }
  }, [homeId, editState, barcode, onAdjusted])

  function enterEditStock() {
    const first = locationEntries[0]
    if (first) setEditState({ location: first, editQuantity: first.quantity })
  }

  function selectLocation(le: LocationEntry) {
    setEditState({ location: le, editQuantity: le.quantity })
  }

  const title = wine?.name ?? name ?? barcode

  if (editState) {
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
                      editState.location.locationId === le.locationId
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
              Beholdning: {editState.location.quantity} → {editState.editQuantity}
            </p>
          </div>

          <QuantityAdjuster value={editState.editQuantity} onChange={handleAdjust} />

          <div className="flex gap-2">
            <button type="button" className="flex-1 py-3 text-base" onClick={() => setEditState(null)}>
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
        className="relative bg-surface w-full sm:max-w-[460px] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-[0_-8px_48px_rgba(0,0,0,0.18)] sm:shadow-[0_8px_48px_rgba(0,0,0,0.22)]"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Close button — always visible, positioned relative to dialog */}
        <button
          type="button"
          aria-label="Lukk"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <span style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(232,224,216,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2c1810',
          }}>
            <X size={14} />
          </span>
        </button>

        {/* Header: bottle image (Oversikt only) left, primary info right */}
        <div className="flex flex-shrink-0" style={{ minHeight: activeTab === 'oversikt' ? '240px' : undefined }}>
          {/* Image column — only on Oversikt */}
          {activeTab === 'oversikt' && (
            <div className="flex-shrink-0 relative" style={{ width: '120px', background: '#fff' }}>
              {wine?.imageUrl
                ? <WineImage src={wine.imageUrl} alt={wine.name} className="absolute inset-0 w-full h-full object-contain p-3" />
                : <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <svg width="36" height="80" viewBox="0 0 36 80" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.35">
                      <path d="M14 0h8v8c0 0 8 8 8 24v36c0 6.627-4.477 12-10 12H16C10.477 80 6 74.627 6 68V32C6 16 14 8 14 8V0Z" fill="var(--color-stone)" stroke="var(--color-clay)" strokeWidth="1.5"/>
                      <rect x="12" y="0" width="12" height="2" rx="1" fill="var(--color-clay)" opacity="0.4"/>
                    </svg>
                  </div>
              }
            </div>
          )}

          {/* Info column */}
          <div className="flex-1 px-5 pt-4 pb-4 flex flex-col justify-between min-w-0 pr-12">
            <div className="flex flex-col gap-3">
              <h2
                className="text-bark leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: '1.75rem', overflowWrap: 'break-word', hyphens: 'auto' }}
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
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* Both panels always rendered; inactive is visibility:hidden to hold height */}
          <div style={{ display: 'grid' }}>
            {/* Oversikt panel */}
            <div
              className="px-6 py-4 flex flex-col gap-5"
              style={{ gridArea: '1/1', visibility: activeTab === 'oversikt' ? 'visible' : 'hidden' }}
            >
              {isLoading ? (
                <div className="flex flex-col gap-2.5 pt-1">
                  {(['55%', '72%', '60%', '45%', '38%'] as const).map((w, i) => (
                    <div key={i} className="shimmer h-3 rounded-full" style={{ width: w, animationDelay: `${i * 55}ms` }} />
                  ))}
                </div>
              ) : isError ? (
                <p className="text-clay text-sm">Kunne ikke laste vindata.</p>
              ) : !wine || (!wine.type && !wine.winery && !wine.region && !wine.country && wine.alcoholContent == null && !wine.storagePotential) ? (
                <p className="text-clay text-sm">Ingen detaljer tilgjengelig for denne vinen ennå.</p>
              ) : (
                <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
                  {wine.type            && <><dt className="text-clay">Type</dt>          <dd>{wine.type}</dd></>}
                  {wine.winery          && <><dt className="text-clay">Produsent</dt>     <dd>{wine.winery}</dd></>}
                  {wine.region          && <><dt className="text-clay">Region</dt>        <dd>{[wine.region, wine.country].filter(Boolean).join(', ')}</dd></>}
                  {!wine.region && wine.country && <><dt className="text-clay">Land</dt>  <dd>{wine.country}</dd></>}
                  {wine.alcoholContent != null  && <><dt className="text-clay">Alkohol</dt>      <dd>{wine.alcoholContent}%</dd></>}
                  {wine.storagePotential        && <><dt className="text-clay">Lagringsevne</dt> <dd>{wine.storagePotential}</dd></>}
                </dl>
              )}
            </div>

            {/* Smak & mat panel */}
            <div
              className="px-6 py-4 flex flex-col gap-5"
              style={{ gridArea: '1/1', visibility: activeTab === 'smak' ? 'visible' : 'hidden' }}
            >
              {isLoading ? (
                <div className="flex flex-col gap-5">
                  <div className="flex gap-6 justify-center py-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="shimmer rounded-full" style={{ width: 44, height: 44, animationDelay: `${i * 100}ms` }} />
                        <div className="shimmer rounded-full h-2 w-10" style={{ animationDelay: `${i * 100 + 60}ms` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {(['72%', '55%', '80%', '45%'] as const).map((w, i) => (
                      <div key={i} className="shimmer h-3 rounded-full" style={{ width: w, animationDelay: `${i * 55}ms` }} />
                    ))}
                  </div>
                </div>
              ) : isError ? (
                <p className="text-clay text-sm">Kunne ikke laste vindata.</p>
              ) : !wine || (!wine.body && !wine.acidity && !wine.tannins && wine.grapes.length === 0 && wine.pairings.length === 0 && !wine.description) ? (
                <p className="text-clay text-sm">Ingen smaks- eller matinformasjon tilgjengelig.</p>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 min-w-0">
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
                  {(wine.body || wine.acidity || wine.tannins) && (
                    <div className="flex gap-6 py-1">
                      {wine.body    && <PieChart label="Fylde"    raw={wine.body} />}
                      {wine.acidity && <PieChart label="Friskhet" raw={wine.acidity} />}
                      {wine.tannins && <PieChart label="Garve"    raw={wine.tannins} />}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Notater panel */}
            <div
              className="px-6 py-4 flex flex-col gap-4"
              style={{ gridArea: '1/1', visibility: activeTab === 'notater' ? 'visible' : 'hidden' }}
            >
              <NotesPanel barcode={barcode} />
            </div>
          </div>
        </div>

        {/* Tab bar — segmented pill control */}
        <div className="border-t border-stone px-5 py-3 flex-shrink-0">
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(44,24,16,0.06)' }}
          >
            {(['oversikt', 'smak', 'notater'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg transition-all duration-200"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.03em',
                  ...(activeTab === tab ? {
                    background: '#722F37',
                    color: '#fff',
                    boxShadow: '0 1px 4px rgba(114,47,55,0.32)',
                  } : {
                    background: 'transparent',
                    color: 'var(--color-clay)',
                  }),
                }}
              >
                {tab === 'oversikt' ? 'Oversikt' : tab === 'smak' ? 'Smak & mat' : 'Notater'}
              </button>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t border-stone px-6 py-4 flex-shrink-0 flex gap-3">
          <button
            type="button"
            onClick={() => toggleFavorite.mutate()}
            disabled={toggleFavorite.isPending}
            aria-label={isFavorite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
            className="secondary shrink-0 px-4 py-3 flex items-center justify-center"
            style={isFavorite ? { color: '#b5881f', borderColor: '#b5881f' } : undefined}
          >
            <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          {homeId && (
            <button type="button" className="flex-1 py-3 text-base" onClick={enterEditStock}>
              Rediger beholdning
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
