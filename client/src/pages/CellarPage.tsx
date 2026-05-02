import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCellarEntries } from '../api/cellars'
import { useCellar } from '../context/CellarContext'
import type { CellarEntry } from '../api/types'
import ScanModal from '../components/ScanModal'
import WineDetailModal from '../components/WineDetailModal'
import FilterBar from '../components/FilterBar'
import WineTable from '../components/WineTable'
import CellarSelector from '../components/CellarSelector'

type ModalMode = 'add' | 'remove' | null

export default function CellarPage() {
  const queryClient = useQueryClient()
  const { activeCellar, isLoading: cellarLoading } = useCellar()

  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<CellarEntry | null>(null)
  const [storageFilter, setStorageFilter] = useState<'drink-now' | 'store' | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [pairingFilter, setPairingFilter] = useState<string | null>(null)
  const [grapeFilter, setGrapeFilter] = useState<string | null>(null)

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['cellar', activeCellar?.id],
    queryFn: () => getCellarEntries(activeCellar!.id),
    enabled: activeCellar !== null,
  })

  function handleAdjusted() {
    queryClient.invalidateQueries({ queryKey: ['cellar', activeCellar?.id] })
  }

  const allPairings = [...new Set(entries?.flatMap(e => e.pairings) ?? [])].sort()
  const allTypes = [...new Set(entries?.map(e => e.type).filter(Boolean) ?? [])].sort() as string[]
  const allGrapes = [...new Set(entries?.flatMap(e => e.grapes) ?? [])].sort()

  function matchesStorageFilter(entry: CellarEntry) {
    if (storageFilter === null) return true
    const sp = entry.storagePotential
    const isDrinkNow = !sp || !sp.toLowerCase().includes('kan også lagres')
    return storageFilter === 'drink-now' ? isDrinkNow : !isDrinkNow
  }

  const visibleEntries = entries?.filter(e =>
    (!pairingFilter || e.pairings.includes(pairingFilter)) &&
    (!grapeFilter || e.grapes.includes(grapeFilter)) &&
    matchesStorageFilter(e) &&
    (!typeFilter || e.type === typeFilter)
  )

  if (cellarLoading) {
    return <p className="text-clay text-sm">Laster…</p>
  }

  if (!activeCellar) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-clay">Du har ingen kjellere ennå.</p>
        <Link to="/profile">
          <button>Opprett din første kjeller</button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <CellarSelector />

      <FilterBar
        storageFilter={storageFilter}
        onStorageFilter={setStorageFilter}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        pairingFilter={pairingFilter}
        onPairingFilter={setPairingFilter}
        grapeFilter={grapeFilter}
        onGrapeFilter={setGrapeFilter}
        allTypes={allTypes}
        allPairings={allPairings}
        allGrapes={allGrapes}
      />

      {error && <p className="text-red-600 text-sm mb-4">Kunne ikke laste kjelleren.</p>}
      {isLoading && <p className="text-clay text-sm">Laster…</p>}
      {!isLoading && !error && !entries?.length && (
        <p className="text-clay text-sm">Kjelleren er tom. Skann en flaske for å legge den til.</p>
      )}
      {visibleEntries && visibleEntries.length === 0 && entries && entries.length > 0 && (
        <p className="text-clay text-sm">Ingen viner matcher filteret.</p>
      )}
      {visibleEntries && visibleEntries.length > 0 && (
        <WineTable entries={visibleEntries} onSelect={setSelected} />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-stone px-6 pt-3 flex gap-3 bottom-bar-safe">
        <button type="button" className="flex-1 py-3 text-base" onClick={() => setModal('add')}>+ Legg til vin</button>
        <button type="button" className="flex-1 py-3 text-base" onClick={() => setModal('remove')}>− Fjern vin</button>
      </div>

      {modal && (
        <ScanModal
          mode={modal}
          cellarId={activeCellar.id}
          onClose={() => setModal(null)}
          onAdjusted={handleAdjusted}
        />
      )}

      {selected && (
        <WineDetailModal
          barcode={selected.barcode}
          name={selected.name}
          quantity={selected.quantity}
          cellarId={activeCellar.id}
          onAdjusted={handleAdjusted}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
