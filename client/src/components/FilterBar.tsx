import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Filters, FilterOptions } from '../hooks/useFilters'

interface Props {
  filters: Filters
  options: FilterOptions
  activeCount: number
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void
}

function filterBtn(active: boolean) {
  return `px-3 py-1 text-[0.8rem] rounded-lg border transition-colors cursor-pointer ${
    active
      ? 'bg-wine text-white border-wine'
      : 'bg-surface text-clay border-stone hover:bg-warm'
  }`
}

export default function FilterBar({ filters, options, activeCount, onFilterChange }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  function toggleLocation(id: number) {
    const next = filters.location.includes(id)
      ? filters.location.filter(l => l !== id)
      : [...filters.location, id]
    onFilterChange('location', next)
  }

  return (
    <div className="sticky top-0 z-10 bg-warm pb-3 mb-1">
      <button
        type="button"
        onClick={() => setFiltersOpen(o => !o)}
        className="flex items-center gap-2 text-base text-clay cursor-pointer mb-2 border-0 bg-transparent p-0"
      >
        <ChevronRight size={14} className={`transition-transform duration-200 ${filtersOpen ? 'rotate-90' : ''}`} />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-wine text-white text-[0.6rem] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {filtersOpen && (
        <div className="flex flex-col divide-y divide-stone bg-stone rounded-lg px-3">
          {options.locations.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Oppbevaring</span>
              {options.locations.map(l => (
                <button key={l.id} type="button" className={filterBtn(filters.location.includes(l.id))} onClick={() => toggleLocation(l.id)}>
                  {l.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap py-2">
            <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Lagring</span>
            {(['drink-now', 'store'] as const).map(opt => (
              <button key={opt} type="button" className={filterBtn(filters.storage === opt)} onClick={() => onFilterChange('storage', filters.storage === opt ? null : opt)}>
                {opt === 'drink-now' ? 'Drikk nå' : 'Kan lagres'}
              </button>
            ))}
          </div>
          {options.types.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Type</span>
              {options.types.map(type => (
                <button key={type} type="button" className={filterBtn(filters.type === type)} onClick={() => onFilterChange('type', filters.type === type ? null : type)}>
                  {type}
                </button>
              ))}
            </div>
          )}
          {options.grapes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Drue</span>
              {options.grapes.map(grape => (
                <button key={grape} type="button" className={filterBtn(filters.grape === grape)} onClick={() => onFilterChange('grape', filters.grape === grape ? null : grape)}>
                  {grape}
                </button>
              ))}
            </div>
          )}
          {options.pairings.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Passer til</span>
              {options.pairings.map(pairing => (
                <button key={pairing} type="button" className={filterBtn(filters.pairing === pairing)} onClick={() => onFilterChange('pairing', filters.pairing === pairing ? null : pairing)}>
                  {pairing}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
