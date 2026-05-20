import type { Entry } from './api/types'

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

export function extractFilterOptions(entries: Entry[]): FilterOptions {
  const seen = new Map<number, { id: number; name: string }>()
  for (const entry of entries)
    for (const le of entry.locations)
      if (le.locationId !== null && !seen.has(le.locationId))
        seen.set(le.locationId, { id: le.locationId, name: le.locationName! })

  return {
    locations: [...seen.values()],
    types:    [...new Set(entries.map(e => e.type).filter(Boolean))].sort() as string[],
    pairings: [...new Set(entries.flatMap(e => e.pairings))].sort(),
    grapes:   [...new Set(entries.flatMap(e => e.grapes))].sort(),
  }
}

export function filterEntries(entries: Entry[], filters: Filters): Entry[] {
  return entries.filter(e => {
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
}
