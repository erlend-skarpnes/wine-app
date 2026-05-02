import { useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Minus } from 'lucide-react'
import { getCellarEntries } from '../api/cellars'
import { useCellar } from '../context/CellarContext'
import type { CellarEntry } from '../api/types'
import ScanModal from '../components/ScanModal'
import WineDetailModal from '../components/WineDetailModal'
import FilterBar from '../components/FilterBar'
import WineTable from '../components/WineTable'

type ModalMode = 'add' | 'remove' | null

function combineEntries(groups: CellarEntry[][]): CellarEntry[] {
  const map = new Map<string, CellarEntry>()
  for (const entries of groups) {
    for (const entry of entries) {
      const existing = map.get(entry.barcode)
      if (existing) {
        map.set(entry.barcode, { ...existing, quantity: existing.quantity + entry.quantity })
      } else {
        map.set(entry.barcode, { ...entry })
      }
    }
  }
  return [...map.values()].sort((a, b) => a.barcode.localeCompare(b.barcode))
}

export default function CellarPage() {
  const queryClient = useQueryClient()
  const { cellars, activeCellar, isLoading: cellarLoading } = useCellar()

  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<CellarEntry | null>(null)
  const [cellarFilter, setCellarFilter] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('cellarFilter')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  function handleCellarFilter(ids: number[]) {
    setCellarFilter(ids)
    localStorage.setItem('cellarFilter', JSON.stringify(ids))
  }
  const [storageFilter, setStorageFilter] = useState<'drink-now' | 'store' | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [pairingFilter, setPairingFilter] = useState<string | null>(null)
  const [grapeFilter, setGrapeFilter] = useState<string | null>(null)

  const entryQueries = useQueries({
    queries: cellars.map(c => ({
      queryKey: ['cellar', c.id] as const,
      queryFn: () => getCellarEntries(c.id),
    })),
  })

  function handleAdjusted() {
    cellars.forEach(c => queryClient.invalidateQueries({ queryKey: ['cellar', c.id] }))
  }

  const isLoading = cellarLoading || entryQueries.some(q => q.isLoading)
  const hasError = entryQueries.some(q => q.isError)

  // Which cellar IDs are currently selected (empty = all)
  const visibleIds = cellarFilter.length > 0 ? cellarFilter : cellars.map(c => c.id)
  const visibleGroups = entryQueries
    .filter((_, i) => visibleIds.includes(cellars[i]?.id))
    .map(q => q.data ?? [])

  const entries = combineEntries(visibleGroups)

  // Per-cellar quantities for all barcodes (used by WineDetailModal)
  const cellarQuantityMap = new Map<string, Map<number, number>>()
  entryQueries.forEach((q, i) => {
    const cellarId = cellars[i]?.id
    if (!cellarId || !q.data) return
    for (const entry of q.data) {
      if (!cellarQuantityMap.has(entry.barcode)) cellarQuantityMap.set(entry.barcode, new Map())
      cellarQuantityMap.get(entry.barcode)!.set(cellarId, entry.quantity)
    }
  })

  const allPairings = [...new Set(entries.flatMap(e => e.pairings))].sort()
  const allTypes = [...new Set(entries.map(e => e.type).filter(Boolean))].sort() as string[]
  const allGrapes = [...new Set(entries.flatMap(e => e.grapes))].sort()

  function matchesStorageFilter(entry: CellarEntry) {
    if (storageFilter === null) return true
    const sp = entry.storagePotential
    const isDrinkNow = !sp || !sp.toLowerCase().includes('kan også lagres')
    return storageFilter === 'drink-now' ? isDrinkNow : !isDrinkNow
  }

  const visibleEntries = entries.filter(e =>
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
        <Link to="/profile"><button>Opprett din første kjeller</button></Link>
      </div>
    )
  }

  return (
    <div>
      <FilterBar
        allCellars={cellars}
        cellarFilter={cellarFilter}
        onCellarFilter={handleCellarFilter}
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

      {hasError && <p className="text-red-600 text-sm mb-4">Kunne ikke laste kjelleren.</p>}
      {isLoading && <p className="text-clay text-sm">Laster…</p>}
      {!isLoading && !hasError && entries.length === 0 && (
        <p className="text-clay text-sm">Kjelleren er tom. Skann en flaske for å legge den til.</p>
      )}
      {!isLoading && visibleEntries.length === 0 && entries.length > 0 && (
        <p className="text-clay text-sm">Ingen viner matcher filteret.</p>
      )}
      {visibleEntries.length > 0 && (
        <WineTable entries={visibleEntries} onSelect={setSelected} />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-stone px-6 pt-3 flex gap-3 bottom-bar-safe">
        <button type="button" className="flex-1 py-3 text-base flex items-center justify-center gap-2" onClick={() => setModal('add')}><Plus size={18} className="shrink-0" /> Legg til vin</button>
        <button type="button" className="flex-1 py-3 text-base flex items-center justify-center gap-2" onClick={() => setModal('remove')}><Minus size={18} className="shrink-0" /> Fjern vin</button>
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
          cellarId={activeCellar.id}
          cellarQuantities={cellarQuantityMap.get(selected.barcode) ?? new Map()}
          onAdjusted={handleAdjusted}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
