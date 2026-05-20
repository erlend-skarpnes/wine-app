import { api } from './client'
import type { WineNote } from './types'

export const getNote = (barcode: string) =>
  api.get<WineNote>(`/notes/${barcode}`)

export const upsertNote = (barcode: string, body: { drinkFromYear: number | null; drinkToYear: number | null; personalNote: string | null }) =>
  api.put<WineNote>(`/notes/${barcode}`, body)
