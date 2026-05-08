import { api } from './client'
import type { Entry, Location, LocationEntry } from './types'

export const getLocations = (homeId: number): Promise<Location[]> =>
  api.get(`/homes/${homeId}/locations`)

export const createLocation = (homeId: number, name: string): Promise<Location> =>
  api.post(`/homes/${homeId}/locations`, { name })

export const renameLocation = (homeId: number, locId: number, name: string): Promise<{ id: number; name: string }> =>
  api.patch(`/homes/${homeId}/locations/${locId}`, { name })

export const deleteLocation = (homeId: number, locId: number): Promise<void> =>
  api.delete(`/homes/${homeId}/locations/${locId}`)

export const createSection = (homeId: number, locId: number, name: string): Promise<{ id: number; name: string }> =>
  api.post(`/homes/${homeId}/locations/${locId}/sections`, { name })

export const renameSection = (homeId: number, locId: number, secId: number, name: string): Promise<{ id: number; name: string }> =>
  api.patch(`/homes/${homeId}/locations/${locId}/sections/${secId}`, { name })

export const deleteSection = (homeId: number, locId: number, secId: number): Promise<void> =>
  api.delete(`/homes/${homeId}/locations/${locId}/sections/${secId}`)

export const getHomeEntries = (homeId: number): Promise<Entry[]> =>
  api.get(`/homes/${homeId}/entries`)

export const getEntryLocations = (homeId: number, barcode: string): Promise<LocationEntry[]> =>
  api.get(`/homes/${homeId}/entries/${barcode}/locations`)

export const adjustEntry = (
  locationId: number,
  barcode: string,
  delta: number,
  sectionId?: number,
): Promise<{ locationId: number; barcode: string; quantity: number; sectionId: number | null }> =>
  api.post(`/locations/${locationId}/entries/adjust`, { barcode, delta, sectionId })
