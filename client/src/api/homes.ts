import { api } from './client'
import type { HomeSummary, HomeMember } from './types'

export const getHomes = (): Promise<HomeSummary[]> =>
  api.get('/homes')

export const createHome = (name: string): Promise<HomeSummary> =>
  api.post('/homes', { name })

export const renameHome = (id: number, name: string): Promise<{ id: number; name: string }> =>
  api.patch(`/homes/${id}`, { name })

export const deleteHome = (id: number): Promise<void> =>
  api.delete(`/homes/${id}`)

export const getHomeMembers = (id: number): Promise<HomeMember[]> =>
  api.get(`/homes/${id}/members`)

export const removeMember = (homeId: number, userId: number): Promise<void> =>
  api.delete(`/homes/${homeId}/members/${userId}`)

export const generateShareLink = (homeId: number): Promise<{ url: string }> =>
  api.post(`/homes/${homeId}/share`, {})

export const getShareTokenInfo = (token: string): Promise<{ homeId: number; homeName: string }> =>
  api.get(`/homes/join/${token}`)

export const joinHome = (token: string): Promise<HomeSummary> =>
  api.post(`/homes/join/${token}`, {})
