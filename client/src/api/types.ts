export interface CellarEntry {
  barcode: string
  quantity: number
  name: string | null
}

export interface WineData {
  barcode: string
  wineApiId: string
  name: string
  type: string | null
  winery: string | null
  region: string | null
  country: string | null
  averageRating: number | null
  ratingsCount: number | null
  body: string | null
  acidity: string | null
  alcoholContent: number | null
  description: string | null
  imageUrl: string | null
  grapes: string[]
  pairings: string[]
}

export interface WineSuggestion {
  id: string
  name: string | null
  type: string | null
  winery: string | null
  region: string | null
  country: string | null
  averageRating: number | null
}

export type IdentifyResponse =
  | { status: 'identified'; wineData: WineData }
  | { status: 'suggestions'; suggestions: WineSuggestion[] }
