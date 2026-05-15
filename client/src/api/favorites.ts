import { api } from './client'
import type { FavoriteItem } from './types'

export const getFavorites = (): Promise<FavoriteItem[]> => api.get('/favorites')
export const addFavorite = (barcode: string): Promise<void> => api.post(`/favorites/${barcode}`, {})
export const removeFavorite = (barcode: string): Promise<void> => api.delete(`/favorites/${barcode}`)
