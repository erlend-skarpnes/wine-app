import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { CellarEntry } from '../api/types'
import ScanModal from '../components/ScanModal'
import WineDetailModal from '../components/WineDetailModal'

type ModalMode = 'add' | 'remove' | null

function filterBtn(active: boolean) {
  return `px-3 py-1 text-[0.8rem] rounded-lg border transition-colors cursor-pointer ${
    active
      ? 'bg-wine text-white border-wine'
      : 'bg-surface text-clay border-stone hover:bg-warm'
  }`
}

export default function CellarPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<CellarEntry | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [storageFilter, setStorageFilter] = useState<'drink-now' | 'store' | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['cellar'],
    queryFn: () => api.get<CellarEntry[]>('/cellar'),
  })

  function handleAdjusted() {
    queryClient.invalidateQueries({ queryKey: ['cellar'] })
  }

  const allPairings = [...new Set(entries?.flatMap(e => e.pairings) ?? [])].sort()
  const allTypes = [...new Set(entries?.map(e => e.type).filter(Boolean) ?? [])].sort() as string[]

  function matchesStorageFilter(entry: CellarEntry) {
    if (storageFilter === null) return true
    const sp = entry.storagePotential
    const isDrinkNow = !sp || !sp.toLowerCase().includes('kan også lagres')
    return storageFilter === 'drink-now' ? isDrinkNow : !isDrinkNow
  }

  const visibleEntries = entries?.filter(e =>
    (!activeFilter || e.pairings.includes(activeFilter)) &&
    matchesStorageFilter(e) &&
    (!typeFilter || e.type === typeFilter)
  )

  return (
    <div>
      <div className="sticky top-0 z-10 bg-warm pb-3 mb-1">
        <div className={`flex flex-wrap gap-1.5 ${allPairings.length > 0 || allTypes.length > 0 ? 'mb-2' : ''}`}>
          {(['drink-now', 'store'] as const).map(opt => (
            <button
              key={opt}
              type="button"
              className={filterBtn(storageFilter === opt)}
              onClick={() => setStorageFilter(prev => prev === opt ? null : opt)}
            >
              {opt === 'drink-now' ? 'Drikk nå' : 'Kan lagres'}
            </button>
          ))}

          {allTypes.map(type => (
            <button
              key={type}
              type="button"
              className={filterBtn(typeFilter === type)}
              onClick={() => setTypeFilter(prev => prev === type ? null : type)}
            >
              {type}
            </button>
          ))}
        </div>

        {allPairings.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allPairings.map(pairing => (
              <button
                key={pairing}
                type="button"
                className={filterBtn(activeFilter === pairing)}
                onClick={() => setActiveFilter(prev => prev === pairing ? null : pairing)}
              >
                {pairing}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-600 text-sm mb-4">Kunne ikke laste kjelleren.</p>}
      {isLoading && <p className="text-clay text-sm">Laster…</p>}
      {!isLoading && !error && !entries?.length && (
        <p className="text-clay text-sm">Kjelleren er tom. Skann en flaske for å legge den til.</p>
      )}

      {visibleEntries && visibleEntries.length > 0 && (
        <table className="w-full border-collapse text-[0.9rem] wine-table">
          <thead>
            <tr>
              <th className="text-left text-xs text-clay font-semibold px-3 py-2 border-b border-stone">Vin</th>
              <th className="text-right text-xs text-clay font-semibold px-3 py-2 border-b border-stone">Flasker</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map(entry => (
              <tr key={entry.barcode} onClick={() => setSelected(entry)} className="cursor-pointer">
                <td className="px-3 py-3 border-b border-stone align-middle">{entry.name ?? entry.barcode}</td>
                <td className="px-3 py-3 border-b border-stone align-middle text-right">
                  <span className="inline-block bg-wine text-white rounded-full px-2.5 py-0.5 text-xs">{entry.quantity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-stone px-6 pt-3 flex gap-3 bottom-bar-safe">
        <button type="button" className="flex-1 py-3 text-base" onClick={() => setModal('add')}>+ Legg til vin</button>
        <button type="button" className="flex-1 py-3 text-base" onClick={() => setModal('remove')}>− Fjern vin</button>
      </div>

      {modal && (
        <ScanModal
          mode={modal}
          onClose={() => setModal(null)}
          onAdjusted={handleAdjusted}
        />
      )}

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
