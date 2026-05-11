import { useState } from 'react'
import type { Entry } from '../api/types'

export interface Filters {
  location: number[]
  storage: 'drink-now' | 'store' | null
  type: string | null
  pairing: string | null
  grape: string | null
}

export interface FilterOptions {
  locations: { id: number; name: string }[]
  types: string[]
  pairings: string[]
  grapes: string[]
}

const EMPTY: Filters = { location: [], storage: null, type: null, pairing: null, grape: null }

function loadLocationFilter(): number[] {
  try {
    const stored = localStorage.getItem('locationFilter')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function useFilters(entries: Entry[]) {
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY,
    location: loadLocationFilter(),
  }))

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'location') localStorage.setItem('locationFilter', JSON.stringify(value))
      return next
    })
  }

  const options: FilterOptions = {
    locations: (() => {
      const seen = new Map<number, { id: number; name: string }>()
      for (const entry of entries)
        for (const le of entry.locations)
          if (le.locationId !== null && !seen.has(le.locationId))
            seen.set(le.locationId, { id: le.locationId, name: le.locationName! })
      return [...seen.values()]
    })(),
    types:    [...new Set(entries.map(e => e.type).filter(Boolean))].sort() as string[],
    pairings: [...new Set(entries.flatMap(e => e.pairings))].sort(),
    grapes:   [...new Set(entries.flatMap(e => e.grapes))].sort(),
  }

  const visibleEntries = entries.filter(e => {
    if (filters.location.length > 0 && !e.locations.some(le => le.locationId !== null && filters.location.includes(le.locationId))) return false
    if (filters.type    && e.type !== filters.type) return false
    if (filters.pairing && !e.pairings.includes(filters.pairing)) return false
    if (filters.grape   && !e.grapes.includes(filters.grape)) return false
    if (filters.storage) {
      const isDrinkNow = !e.storagePotential || !e.storagePotential.toLowerCase().includes('kan også lagres')
      if (filters.storage === 'drink-now' ? !isDrinkNow : isDrinkNow) return false
    }
    return true
  })

  const activeCount =
    (filters.location.length > 0 ? 1 : 0) +
    [filters.storage, filters.type, filters.pairing, filters.grape].filter(Boolean).length

  return { filters, options, visibleEntries, setFilter, activeCount }
}
