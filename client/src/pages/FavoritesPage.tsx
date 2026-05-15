import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { getFavorites } from '../api/favorites'
import { queryKeys } from '../api/queryKeys'
import WineDetailModal from '../components/WineDetailModal'
import type { FavoriteItem } from '../api/types'

function typeAccentColor(type: string | null): string {
  if (!type) return '#722F37'
  const t = type.toLowerCase()
  if (t.includes('hvit')) return '#b5881f'
  if (t.includes('rosé') || t.includes('rose')) return '#c47080'
  if (t.includes('musserende') || t.includes('champagne') || t.includes('cava') || t.includes('prosecco')) return '#6b8f5e'
  return '#722F37'
}

export default function FavoritesPage() {
  const [selected, setSelected] = useState<FavoriteItem | null>(null)

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: getFavorites,
  })

  return (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-bark mb-6"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '2rem', fontWeight: 600 }}
      >
        Favoritter
      </h1>

      {isLoading && (
        <div className="-mx-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center pl-6 pr-5 py-3.5 border-b border-stone" style={{ animation: `entrySlideIn 0.3s ease-out ${i * 45}ms both` }}>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="shimmer h-[1.05rem] rounded" style={{ width: ['72%', '58%', '80%', '65%'][i], animationDelay: `${i * 30}ms` }} />
                <div className="shimmer h-[0.73rem] rounded" style={{ width: ['40%', '35%', '45%', '30%'][i], animationDelay: `${i * 30 + 60}ms` }} />
              </div>
              <div className="shimmer ml-4 rounded-full" style={{ width: 16, height: 16 }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && favorites.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Star size={32} className="text-stone" />
          <p className="text-clay text-sm">Ingen favoritter ennå.</p>
          <p className="text-clay/60 text-xs">Trykk på stjernen i vindetaljer for å legge til.</p>
        </div>
      )}

      {!isLoading && favorites.length > 0 && (
        <div className="-mx-6">
          {favorites.map((item, i) => {
            const accent = typeAccentColor(item.wineType)
            return (
              <button
                key={item.barcode}
                type="button"
                onClick={() => setSelected(item)}
                className="relative w-full flex items-center pl-6 pr-5 py-3.5 border-b border-stone bg-transparent text-left"
                style={{ animation: `entrySlideIn 0.3s ease-out ${i * 35}ms both` }}
              >
                <div
                  className="absolute left-0 rounded-r-full"
                  style={{ background: accent, width: '3px', top: '18%', bottom: '18%' }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="leading-snug truncate"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.08rem', fontWeight: 600, color: 'var(--color-bark)' }}
                  >
                    {item.wineName ?? item.barcode}
                  </p>
                  {item.wineType && <p className="text-[0.73rem] text-clay mt-0.5">{item.wineType}</p>}
                </div>
                <Star size={14} className="ml-4 shrink-0" style={{ color: '#b5881f' }} fill="#b5881f" />
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.wineName}
          quantity={0}
          onAdjusted={() => {}}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
