import { api } from './client'
import type { WineSampleSummary } from './types'

export function submitSample(barcode: string, image: Blob): Promise<void> {
  const form = new FormData()
  form.append('image', image, 'label.jpg')
  return api.postForm<void>(`/samples/${encodeURIComponent(barcode)}`, form)
}

export function getAdminSamples(): Promise<WineSampleSummary[]> {
  return api.get<WineSampleSummary[]>('/admin/samples')
}
