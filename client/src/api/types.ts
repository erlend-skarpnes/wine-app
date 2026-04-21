export interface Wine {
  id: number
  name: string
  winery: string
  vintage: number | null
  varietal: string
  region: string
  country: string
  description: string | null
  labelImageUrl: string | null
  barcode: string | null
  createdAt: string
  updatedAt: string
  cellarEntries?: CellarEntry[]
}

export interface CellarEntry {
  id: number
  wineId: number
  wine?: Wine
  quantity: number
  purchasePrice: number | null
  purchasedAt: string | null
  drinkFrom: number | null
  drinkUntil: number | null
  location: string | null
  notes: string | null
  createdAt: string
}
