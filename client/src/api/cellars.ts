import { api } from './client'
import type { CellarEntry, CellarMember, CellarSummary } from './types'

export const getCellars = (): Promise<CellarSummary[]> =>
  api.get('/cellars')

export const createCellar = (name: string): Promise<CellarSummary> =>
  api.post('/cellars', { name })

export const renameCellar = (id: number, name: string): Promise<{ id: number; name: string }> =>
  api.patch(`/cellars/${id}`, { name })

export const deleteCellar = (id: number): Promise<void> =>
  api.delete(`/cellars/${id}`)

export const getCellarMembers = (id: number): Promise<CellarMember[]> =>
  api.get(`/cellars/${id}/members`)

export const removeMember = (cellarId: number, userId: number): Promise<void> =>
  api.delete(`/cellars/${cellarId}/members/${userId}`)

export const generateShareLink = (cellarId: number): Promise<{ url: string }> =>
  api.post(`/cellars/${cellarId}/share`, {})

export const getShareTokenInfo = (token: string): Promise<{ cellarId: number; cellarName: string }> =>
  api.get(`/cellars/join/${token}`)

export const joinCellar = (token: string): Promise<CellarSummary> =>
  api.post(`/cellars/join/${token}`, {})

export const getCellarEntries = (cellarId: number): Promise<CellarEntry[]> =>
  api.get(`/cellars/${cellarId}/entries`)

export const adjustEntry = (cellarId: number, barcode: string, delta: number): Promise<CellarEntry> =>
  api.post(`/cellars/${cellarId}/entries/adjust`, { barcode, delta })
