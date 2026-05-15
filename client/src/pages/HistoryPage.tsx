import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GlassWater } from 'lucide-react'
import { getDrinkHistory } from '../api/history'
import { queryKeys } from '../api/queryKeys'
import WineDetailModal from '../components/WineDetailModal'
import type { DrinkHistoryItem } from '../api/types'

function typeAccentColor(type: string | null): string {
  if (!type) return '#722F37'
  const t = type.toLowerCase()
  if (t.includes('hvit')) return '#b5881f'
  if (t.includes('rosé') || t.includes('rose')) return '#c47080'
  if (t.includes('musserende') || t.includes('champagne') || t.includes('cava') || t.includes('prosecco')) return '#6b8f5e'
  return '#722F37'
}

export default function HistoryPage() {
  const [selected, setSelected] = useState<DrinkHistoryItem | null>(null)

  const { data: history = [], isLoading } = useQuery({
    queryKey: queryKeys.drinkHistory(),
    queryFn: getDrinkHistory,
  })

  return (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-bark mb-6"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '2rem', fontWeight: 600 }}
      >
        Drukket
      </h1>

      {isLoading && (
        <div className="-mx-6">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center pl-6 pr-5 py-3.5 border-b border-stone" style={{ animation: `entrySlideIn 0.3s ease-out ${i * 45}ms both` }}>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="shimmer h-[1.05rem] rounded" style={{ width: ['72%', '58%', '80%', '65%', '75%'][i], animationDelay: `${i * 30}ms` }} />
                <div className="shimmer h-[0.73rem] rounded" style={{ width: ['45%', '38%', '50%', '35%', '42%'][i], animationDelay: `${i * 30 + 60}ms` }} />
              </div>
              <div className="ml-4 flex flex-col items-end gap-1.5">
                <div className="shimmer rounded" style={{ width: '1.4rem', height: '1.6rem', animationDelay: `${i * 30 + 40}ms` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && history.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <GlassWater size={32} className="text-stone" />
          <p className="text-clay text-sm">Ingen historikk ennå.</p>
          <p className="text-clay/60 text-xs">Flasker du skanner ut dukker opp her.</p>
        </div>
      )}

      {!isLoading && history.length > 0 && (
        <div className="-mx-6">
          {history.map((item, i) => {
            const accent = typeAccentColor(item.wineType)
            const dateStr = new Date(item.drankAt).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="relative w-full flex items-center pl-6 pr-5 py-3.5 border-b border-stone bg-transparent text-left"
                style={{ animation: `entrySlideIn 0.3s ease-out ${i * 35}ms both` }}
              >
                <div
                  className="absolute left-0 rounded-r-full"
                  style={{ background: accent, width: '3px', top: '18%', bottom: '18%', opacity: 0.6 }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="leading-snug truncate"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.08rem', fontWeight: 600, color: 'var(--color-bark)' }}
                  >
                    {item.wineName ?? item.barcode}
                  </p>
                  <p className="text-[0.73rem] text-clay mt-0.5">{dateStr} · {item.homeName}</p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <span
                    className="text-[1.35rem] leading-none font-semibold"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: accent }}
                  >
                    {item.quantity}
                  </span>
                  <p className="text-[0.6rem] text-clay uppercase tracking-wide">fl.</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.wineName}
          homeId={selected.homeId}
          quantity={0}
          onAdjusted={() => {}}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
