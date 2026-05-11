export interface HomeSummary {
  id: number
  name: string
  isOwner: boolean
  memberCount: number
}

export interface HomeMember {
  userId: number
  username: string
  isOwner: boolean
  joinedAt: string
}

export interface Section {
  id: number
  name: string
}

export interface Location {
  id: number
  name: string
  sections: Section[]
}

export interface LocationEntry {
  locationId: number | null
  locationName: string | null
  sectionId: number | null
  sectionName: string | null
  quantity: number
}

export interface Entry {
  barcode: string
  quantity: number
  name: string | null
  type: string | null
  pairings: string[]
  grapes: string[]
  storagePotential: string | null
  alcoholContent: number | null
  locations: LocationEntry[]
}

export interface AdminUser {
  id: number
  username: string
  isAdmin: boolean
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
  tannins: string | null
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
