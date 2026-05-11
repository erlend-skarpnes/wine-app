import type { WineSuggestion } from '../api/types'

export type ScanState =
  | { status: 'scanning' }
  | { status: 'location-pick'; barcode: string; selectedLocationId: number }
  | { status: 'section-pick'; barcode: string; locationId: number; selectedSectionId: number | null }
  | { status: 'loading' }
  | { status: 'success'; barcode: string; locationId: number; quantity: number; prevQuantity: number; wineName: string | null; imageUrl: string | null }
  | { status: 'error'; message: string }
  | { status: 'capture'; barcode: string; locationId: number; quantity: number }
  | { status: 'identifying'; barcode: string; locationId: number; quantity: number }
  | { status: 'suggestions'; barcode: string; locationId: number; quantity: number; suggestions: WineSuggestion[] }
  | { status: 'linking'; barcode: string; locationId: number; quantity: number; wineName: string | null }

export type ScanAction =
  | { type: 'GO_TO_LOCATION_PICK'; barcode: string; selectedLocationId: number }
  | { type: 'GO_TO_SECTION_PICK'; barcode: string; locationId: number }
  | { type: 'PICK_LOCATION'; locationId: number }
  | { type: 'PICK_SECTION'; sectionId: number | null }
  | { type: 'ADJUST_START' }
  | { type: 'ADJUST_SUCCESS'; barcode: string; locationId: number; quantity: number; prevQuantity: number; wineName: string | null; imageUrl: string | null }
  | { type: 'GO_TO_CAPTURE'; barcode: string; locationId: number; quantity: number }
  | { type: 'ADJUST_ERROR'; message: string }
  | { type: 'IDENTIFY_START' }
  | { type: 'IDENTIFIED'; wineName: string | null; imageUrl: string | null }
  | { type: 'SUGGESTIONS'; suggestions: WineSuggestion[] }
  | { type: 'IDENTIFY_FAILED' }
  | { type: 'LINK_START'; wineName: string | null }
  | { type: 'LINKED'; wineName: string | null; imageUrl: string | null }
  | { type: 'SKIP_IDENTIFY' }
  | { type: 'INLINE_ADJUST_SUCCESS'; quantity: number }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

export const initialScanState: ScanState = { status: 'scanning' }

export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'GO_TO_LOCATION_PICK':
      return { status: 'location-pick', barcode: action.barcode, selectedLocationId: action.selectedLocationId }

    case 'GO_TO_SECTION_PICK':
      return { status: 'section-pick', barcode: action.barcode, locationId: action.locationId, selectedSectionId: null }

    case 'PICK_LOCATION':
      if (state.status !== 'location-pick') return state
      return { ...state, selectedLocationId: action.locationId }

    case 'PICK_SECTION':
      if (state.status !== 'section-pick') return state
      return { ...state, selectedSectionId: action.sectionId }

    case 'ADJUST_START':
      return { status: 'loading' }

    case 'ADJUST_SUCCESS':
      return { status: 'success', barcode: action.barcode, locationId: action.locationId, quantity: action.quantity, prevQuantity: action.prevQuantity, wineName: action.wineName, imageUrl: action.imageUrl }

    case 'GO_TO_CAPTURE':
      return { status: 'capture', barcode: action.barcode, locationId: action.locationId, quantity: action.quantity }

    case 'ADJUST_ERROR':
      return { status: 'error', message: action.message }

    case 'IDENTIFY_START':
      if (state.status !== 'capture') return state
      return { status: 'identifying', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity }

    case 'IDENTIFIED':
      if (state.status !== 'identifying') return state
      return { status: 'success', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity, prevQuantity: state.quantity - 1, wineName: action.wineName, imageUrl: action.imageUrl }

    case 'SUGGESTIONS':
      if (state.status !== 'identifying') return state
      return { status: 'suggestions', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity, suggestions: action.suggestions }

    case 'IDENTIFY_FAILED':
      if (state.status !== 'identifying') return state
      return { status: 'capture', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity }

    case 'LINK_START':
      if (state.status !== 'suggestions') return state
      return { status: 'linking', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity, wineName: action.wineName }

    case 'LINKED':
      if (state.status !== 'linking') return state
      return { status: 'success', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity, prevQuantity: state.quantity - 1, wineName: action.wineName, imageUrl: action.imageUrl }

    case 'SKIP_IDENTIFY':
      if (state.status !== 'suggestions') return state
      return { status: 'success', barcode: state.barcode, locationId: state.locationId, quantity: state.quantity, prevQuantity: state.quantity - 1, wineName: null, imageUrl: null }

    case 'INLINE_ADJUST_SUCCESS':
      if (state.status !== 'success') return state
      return { ...state, quantity: action.quantity }

    case 'ERROR':
      return { status: 'error', message: action.message }

    case 'RESET':
      return { status: 'scanning' }

    default:
      return state
  }
}
