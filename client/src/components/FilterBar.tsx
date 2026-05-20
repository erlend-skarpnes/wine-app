import { useState } from 'react'
import type { ReactNode } from 'react'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import type { Filters, FilterOptions } from '../hooks/useFilters'

interface Props {
  filters: Filters
  options: FilterOptions
  activeCount: number
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void
}

function chip(active: boolean) {
  return [
    'px-3 py-1.5 text-[0.78rem] rounded-full border whitespace-nowrap shrink-0 transition-all cursor-pointer leading-none',
    active
      ? 'bg-bark text-white border-bark'
      : 'bg-surface text-clay border-stone hover:border-clay',
  ].join(' ')
}

function CategoryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[0.6rem] font-semibold text-clay uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {children}
      </div>
    </div>
  )
}

export default function FilterBar({ filters, options, activeCount, onFilterChange }: Props) {
  const [open, setOpen] = useState(false)

  function toggleLocation(id: number) {
    const next = filters.location.includes(id)
      ? filters.location.filter(l => l !== id)
      : [...filters.location, id]
    onFilterChange('location', next)
  }

  function clearAll() {
    onFilterChange('location', [])
    onFilterChange('type', null)
    onFilterChange('grape', null)
    onFilterChange('pairing', null)
  }

  const activeSummary = [
    ...filters.location.map(id => options.locations.find(l => l.id === id)?.name).filter(Boolean),
    filters.type,
    filters.grape,
    filters.pairing,
  ].filter(Boolean).join(' · ')

  return (
    <div className="sticky top-0 z-10 bg-warm">
      {/* Toggle row */}
      <div className="py-2.5">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-[0.72rem] cursor-pointer border-0 bg-transparent p-0 w-full text-left"
        >
          <SlidersHorizontal size={11} strokeWidth={2.5} className="text-clay shrink-0" />
          <span className="uppercase tracking-widest font-semibold text-clay shrink-0">Filter</span>
          {!open && activeSummary && (
            <span className="text-bark font-medium text-[0.72rem] truncate normal-case tracking-normal min-w-0">
              · {activeSummary}
            </span>
          )}
          {open && activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-wine text-white text-[0.58rem] font-bold shrink-0">
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={11}
            strokeWidth={2.5}
            className={`text-clay ml-auto shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Expandable panel */}
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: open ? '800px' : '0' }}
      >
        <div className="bg-stone rounded-xl px-4 pt-3 pb-4 mb-3 flex flex-col gap-3">
          {options.locations.length > 1 && (
            <CategoryRow label="Oppbevaring">
              {options.locations.map(l => (
                <button key={l.id} type="button" className={chip(filters.location.includes(l.id))} onClick={() => toggleLocation(l.id)}>
                  {l.name}
                </button>
              ))}
            </CategoryRow>
          )}

          {options.types.length > 0 && (
            <CategoryRow label="Type">
              {options.types.map(type => (
                <button key={type} type="button" className={chip(filters.type === type)} onClick={() => onFilterChange('type', filters.type === type ? null : type)}>
                  {type}
                </button>
              ))}
            </CategoryRow>
          )}

          {options.grapes.length > 0 && (
            <CategoryRow label="Drue">
              {options.grapes.map(grape => (
                <button key={grape} type="button" className={chip(filters.grape === grape)} onClick={() => onFilterChange('grape', filters.grape === grape ? null : grape)}>
                  {grape}
                </button>
              ))}
            </CategoryRow>
          )}

          {options.pairings.length > 0 && (
            <CategoryRow label="Passer til">
              {options.pairings.map(pairing => (
                <button key={pairing} type="button" className={chip(filters.pairing === pairing)} onClick={() => onFilterChange('pairing', filters.pairing === pairing ? null : pairing)}>
                  {pairing}
                </button>
              ))}
            </CategoryRow>
          )}

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="self-start text-[0.7rem] text-clay bg-transparent border-0 p-0 cursor-pointer underline underline-offset-2 decoration-stone hover:decoration-clay transition-colors normal-case tracking-normal font-normal"
            >
              Nullstill filter
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
