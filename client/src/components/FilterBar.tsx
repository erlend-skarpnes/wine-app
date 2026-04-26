import { useState } from 'react'

interface Props {
  storageFilter: 'drink-now' | 'store' | null
  onStorageFilter: (v: 'drink-now' | 'store' | null) => void
  typeFilter: string | null
  onTypeFilter: (v: string | null) => void
  pairingFilter: string | null
  onPairingFilter: (v: string | null) => void
  allTypes: string[]
  allPairings: string[]
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
  allTypes, allPairings,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = [storageFilter, typeFilter, pairingFilter].filter(Boolean).length

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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
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
            <div className="flex items-center gap-1.5 flex-wrap">
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

          {allPairings.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
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
