import { api } from './client'
import type { DrinkHistoryItem } from './types'

export function getDrinkHistory(): Promise<DrinkHistoryItem[]> {
  return api.get('/history')
}
