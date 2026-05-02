import { api } from './client'
import type { IdentifyResponse, WineData } from './types'

export function getWineData(barcode: string): Promise<WineData> {
  return api.get<WineData>(`/wines/${encodeURIComponent(barcode)}`)
}

export function identifyWine(barcode: string, image: Blob): Promise<IdentifyResponse> {
  const form = new FormData()
  form.append('barcode', barcode)
  form.append('image', image, 'label.jpg')
  return api.postForm<IdentifyResponse>('/wines/identify', form)
}

export function linkWine(barcode: string, productCode: string): Promise<WineData> {
  return api.post<WineData>('/wines/link', { barcode, productCode })
}
