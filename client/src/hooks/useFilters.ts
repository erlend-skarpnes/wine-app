import { useState } from 'react'
import type { Entry } from '../api/types'
import { type Filters, extractFilterOptions, filterEntries } from '../stockFilters'

export type { Filters, FilterOptions } from '../stockFilters'

const EMPTY: Filters = { location: [], type: null, pairing: null, grape: null }

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

  const options = extractFilterOptions(entries)
  const visibleEntries = filterEntries(entries, filters)
  const activeCount =
    (filters.location.length > 0 ? 1 : 0) +
    [filters.type, filters.pairing, filters.grape].filter(Boolean).length

  return { filters, options, visibleEntries, setFilter, activeCount }
}
