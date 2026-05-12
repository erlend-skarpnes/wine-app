import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Minus } from 'lucide-react'
import { getHomeEntries } from '../api/locations'
import { queryKeys } from '../api/queryKeys'
import { useHome } from '../context/HomeContext'
import { useFilters } from '../hooks/useFilters'
import type { Entry } from '../api/types'
import ScanModal from '../components/ScanModal'
import WineDetailModal from '../components/WineDetailModal'
import FilterBar from '../components/FilterBar'
import WineTable from '../components/WineTable'
import WineTableSkeleton from '../components/WineTableSkeleton'

type ModalMode = 'add' | 'remove' | null

export default function CellarPage() {
  const queryClient = useQueryClient()
  const { activeHome, isLoading: homeLoading } = useHome()

  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Entry | null>(null)

  const { data: entries = [], isLoading: entriesLoading, isError } = useQuery<Entry[]>({
    queryKey: activeHome ? queryKeys.homeEntries(activeHome.id) : ['home-entries'],
    queryFn: () => getHomeEntries(activeHome!.id),
    enabled: !!activeHome,
  })

  const { filters, options, visibleEntries, setFilter, activeCount } = useFilters(entries)

  function handleAdjusted() {
    if (activeHome) {
      queryClient.invalidateQueries({ queryKey: queryKeys.homeEntries(activeHome.id) })
      if (selected) {
        queryClient.invalidateQueries({ queryKey: queryKeys.entryLocations(activeHome.id, selected.barcode) })
      }
    }
  }

  const isLoading = homeLoading || entriesLoading

  if (homeLoading) {
    return <WineTableSkeleton />
  }

  if (!activeHome) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-clay">Du har ingen hjem ennå.</p>
        <Link to="/profile"><button>Opprett ditt første hjem</button></Link>
      </div>
    )
  }

  return (
    <div>
      <FilterBar filters={filters} options={options} activeCount={activeCount} onFilterChange={setFilter} />

      {isError   && <p className="text-red-600 text-sm mb-4">Kunne ikke laste hjemmet.</p>}
      {isLoading && <WineTableSkeleton />}
      {!isLoading && !isError && entries.length === 0 && (
        <p className="text-clay text-sm">Hjemmet er tomt. Skann en flaske for å legge den til.</p>
      )}
      {!isLoading && visibleEntries.length === 0 && entries.length > 0 && (
        <p className="text-clay text-sm">Ingen viner matcher filteret.</p>
      )}
      {visibleEntries.length > 0 && (
        <WineTable entries={visibleEntries} onSelect={setSelected} />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-stone px-6 pt-3 flex gap-3 bottom-bar-safe">
        <button type="button" className="flex-1 py-3 text-base flex items-center justify-center gap-2" onClick={() => setModal('add')}>
          <Plus size={18} className="shrink-0" /> Legg til vin
        </button>
        <button type="button" className="flex-1 py-3 text-base flex items-center justify-center gap-2" onClick={() => setModal('remove')}>
          <Minus size={18} className="shrink-0" /> Fjern vin
        </button>
      </div>

      {modal && (
        <ScanModal
          mode={modal}
          homeId={activeHome.id}
          onClose={() => setModal(null)}
          onAdjusted={handleAdjusted}
        />
      )}

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.name}
          homeId={activeHome.id}
          quantity={selected.quantity}
          onAdjusted={handleAdjusted}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
