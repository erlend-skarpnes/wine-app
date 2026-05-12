import { MapPin } from 'lucide-react'
import type { Entry } from '../api/types'

interface Props {
  entries: Entry[]
  onSelect: (entry: Entry) => void
}

function typeAccentColor(type: string | null): string {
  if (!type) return '#9a8a7a'
  const t = type.toLowerCase()
  if (t.includes('rød')) return '#722F37'
  if (t.includes('hvit')) return '#b5881f'
  if (t.includes('rosé') || t.includes('rose')) return '#c47080'
  if (t.includes('muss') || t.includes('champagne') || t.includes('cava') || t.includes('prosecco')) return '#6b8f5e'
  if (t.includes('sterk') || t.includes('dessert') || t.includes('port') || t.includes('sherry')) return '#8B5E3C'
  return '#9a8a7a'
}

export default function WineTable({ entries, onSelect }: Props) {
  return (
    <div role="list" className="-mx-6">
      {entries.map((entry, i) => {
        const accent = typeAccentColor(entry.type)

        const primaryGrape = entry.grapes[0]
          ? entry.grapes[0].replace(/\s+\d+%$/, '').split(' ').slice(0, 2).join(' ')
          : null
        const secondary = [entry.type, primaryGrape].filter(Boolean).join(' · ')

        const primaryLoc = entry.locations.length > 0
          ? entry.locations.reduce((best, le) => le.quantity > best.quantity ? le : best)
          : null
        const locationLabel = primaryLoc?.locationName
          ? primaryLoc.locationName
            + (primaryLoc.sectionName ? ` › ${primaryLoc.sectionName}` : '')
            + (entry.locations.length > 1 ? ` +${entry.locations.length - 1}` : '')
          : null

        return (
          <div
            key={entry.barcode}
            role="listitem"
            onClick={() => onSelect(entry)}
            className="relative flex items-center pl-6 pr-5 py-3.5 border-b border-stone cursor-pointer hover:bg-warm transition-colors"
            style={{ animation: `entrySlideIn 0.32s ease-out ${Math.min(i * 28, 350)}ms both` }}
          >
            {/* Type accent stripe */}
            <div
              className="absolute left-0 rounded-r-full"
              style={{ background: accent, width: '3px', top: '18%', bottom: '18%' }}
            />

            {/* Name + secondary info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-bark leading-snug truncate"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: '1.05rem' }}
              >
                {entry.name ?? entry.barcode}
              </p>
              {secondary && (
                <p className="text-clay text-[0.73rem] mt-0.5 truncate leading-tight">{secondary}</p>
              )}
              {locationLabel && (
                <span
                  className="inline-flex items-center gap-[3px] mt-0.5 leading-tight text-[0.68rem]"
                  style={{ color: accent, opacity: 0.75 }}
                >
                  <MapPin size={8} strokeWidth={2.5} />
                  {locationLabel}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col items-end ml-4 shrink-0">
              <span
                className="leading-none font-semibold"
                style={{ color: accent, fontSize: '1.6rem', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {entry.quantity}
              </span>
              <span className="text-clay text-[0.6rem] uppercase tracking-[0.06em] mt-0.5">fl.</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
