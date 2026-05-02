export interface AdminUser {
  id: number
  username: string
  isAdmin: boolean
}

export interface CellarEntry {
  barcode: string
  quantity: number
  name: string | null
  type: string | null
  pairings: string[]
  grapes: string[]
  storagePotential: string | null
  alcoholContent: number | null
}

export interface WineData {
  barcode: string
  productCode: string
  name: string
  vintage: string | null
  type: string | null
  winery: string | null
  region: string | null
  country: string | null
  body: string | null
  acidity: string | null
  alcoholContent: number | null
  description: string | null
  imageUrl: string | null
  grapes: string[]
  pairings: string[]
  storagePotential: string | null
}

export interface WineSuggestion {
  id: string
  name: string | null
  type: string | null
  winery: string | null
  region: string | null
  country: string | null
}

export type IdentifyResponse =
  | { status: 'identified'; wineData: WineData }
  | { status: 'suggestions'; suggestions: WineSuggestion[] }
