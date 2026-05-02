import { useState } from 'react'

interface CellarOption {
  id: number
  name: string
}

interface Props {
  storageFilter: 'drink-now' | 'store' | null
  onStorageFilter: (v: 'drink-now' | 'store' | null) => void
  typeFilter: string | null
  onTypeFilter: (v: string | null) => void
  pairingFilter: string | null
  onPairingFilter: (v: string | null) => void
  grapeFilter: string | null
  onGrapeFilter: (v: string | null) => void
  allTypes: string[]
  allPairings: string[]
  allGrapes: string[]
  allCellars: CellarOption[]
  cellarFilter: number[]
  onCellarFilter: (ids: number[]) => void
}

function filterBtn(active: boolean) {
  return `px-3 py-1 text-[0.8rem] rounded-lg border transition-colors cursor-pointer ${
    active
      ? 'bg-wine text-white border-wine'
      : 'bg-surface text-clay border-stone hover:bg-warm'
  }`
}

export default function FilterBar({
  storageFilter, onStorageFilter,
  typeFilter, onTypeFilter,
  pairingFilter, onPairingFilter,
  grapeFilter, onGrapeFilter,
  allTypes, allPairings, allGrapes,
  allCellars, cellarFilter, onCellarFilter,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = [storageFilter, typeFilter, pairingFilter, grapeFilter].filter(Boolean).length
    + (cellarFilter.length > 0 ? 1 : 0)

  function toggleCellar(id: number) {
    onCellarFilter(
      cellarFilter.includes(id) ? cellarFilter.filter(c => c !== id) : [...cellarFilter, id]
    )
  }

  return (
    <div className="sticky top-0 z-10 bg-warm pb-3 mb-1">
      <button
        type="button"
        onClick={() => setFiltersOpen(o => !o)}
        className="flex items-center gap-2 text-base text-clay cursor-pointer mb-2 border-0 bg-transparent p-0"
      >
        <span className={`transition-transform duration-200 text-[0.6rem] ${filtersOpen ? 'rotate-90' : ''}`}>▶</span>
        <span>Filter</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-wine text-white text-[0.6rem] font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {filtersOpen && (
        <div className="flex flex-col divide-y divide-stone bg-stone rounded-lg px-3">
          {allCellars.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Kjeller</span>
              {allCellars.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={filterBtn(cellarFilter.includes(c.id))}
                  onClick={() => toggleCellar(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap py-2">
            <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Lagring</span>
            {(['drink-now', 'store'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                className={filterBtn(storageFilter === opt)}
                onClick={() => onStorageFilter(storageFilter === opt ? null : opt)}
              >
                {opt === 'drink-now' ? 'Drikk nå' : 'Kan lagres'}
              </button>
            ))}
          </div>

          {allTypes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Type</span>
              {allTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  className={filterBtn(typeFilter === type)}
                  onClick={() => onTypeFilter(typeFilter === type ? null : type)}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {allGrapes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Drue</span>
              {allGrapes.map(grape => (
                <button
                  key={grape}
                  type="button"
                  className={filterBtn(grapeFilter === grape)}
                  onClick={() => onGrapeFilter(grapeFilter === grape ? null : grape)}
                >
                  {grape}
                </button>
              ))}
            </div>
          )}

          {allPairings.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap py-2">
              <span className="text-[0.7rem] font-semibold text-clay uppercase tracking-wide w-14 shrink-0">Passer til</span>
              {allPairings.map(pairing => (
                <button
                  key={pairing}
                  type="button"
                  className={filterBtn(pairingFilter === pairing)}
                  onClick={() => onPairingFilter(pairingFilter === pairing ? null : pairing)}
                >
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
