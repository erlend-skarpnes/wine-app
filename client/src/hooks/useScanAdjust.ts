import { useCallback } from 'react'
import type { Dispatch } from 'react'
import { adjustEntry } from '../api/locations'
import { getWineData } from '../api/wine'
import { ApiError } from '../api/client'
import type { ScanAction } from '../components/scanReducer'

export function useScanAdjust(
  dispatch: Dispatch<ScanAction>,
  homeId: number,
  mode: 'add' | 'remove',
  onAdjusted: () => void,
) {
  return useCallback(async (barcode: string, locationId?: number, sectionId?: number) => {
    dispatch({ type: 'ADJUST_START' })
    try {
      const delta = mode === 'add' ? 1 : -1
      const result = await adjustEntry(homeId, barcode, delta, locationId, sectionId)
      const loc = locationId ?? null
      const prevQuantity = result.quantity - delta
      try {
        const wineData = await getWineData(barcode)
        onAdjusted()
        dispatch({ type: 'ADJUST_SUCCESS', barcode, locationId: loc, quantity: result.quantity, prevQuantity, wineName: wineData.name, imageUrl: wineData.imageUrl })
      } catch {
        onAdjusted()
        if (mode === 'add') {
          dispatch({ type: 'GO_TO_CAPTURE', barcode, locationId: loc, quantity: result.quantity })
        } else {
          dispatch({ type: 'ADJUST_SUCCESS', barcode, locationId: loc, quantity: result.quantity, prevQuantity, wineName: null, imageUrl: null })
        }
      }
    } catch (err) {
      const message = err instanceof ApiError && err.code === 'NOTHING_TO_REMOVE'
        ? 'Ingenting å fjerne.'
        : 'Noe gikk galt.'
      dispatch({ type: 'ADJUST_ERROR', message })
    }
  }, [dispatch, homeId, mode, onAdjusted])
}
