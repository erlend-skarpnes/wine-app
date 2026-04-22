import { api } from './client'
import type { IdentifyResponse, WineData } from './types'

export function getWineData(barcode: string): Promise<WineData> {
  return api.get<WineData>(`/wines/${encodeURIComponent(barcode)}`)
}

export async function identifyWine(barcode: string, image: Blob): Promise<IdentifyResponse> {
  const form = new FormData()
  form.append('barcode', barcode)
  form.append('image', image, 'label.jpg')

  const res = await fetch('/api/wines/identify', { method: 'POST', body: form })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`POST /wines/identify → ${res.status}: ${text}`)
  }
  return res.json() as Promise<IdentifyResponse>
}

export function linkWine(barcode: string, wineApiId: string): Promise<WineData> {
  return api.post<WineData>('/wines/link', { barcode, wineApiId })
}
