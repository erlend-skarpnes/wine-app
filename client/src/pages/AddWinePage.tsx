import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { CreateWine, Wine } from '../api/types'

type CellarFields = {
  quantity: number
  purchasePrice: string
  drinkFrom: string
  drinkUntil: string
  location: string
  notes: string
}

export default function AddWinePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillBarcode = searchParams.get('barcode')

  const [wine, setWine] = useState<CreateWine>({
    name: '', winery: '', varietal: '', region: '', country: '',
    vintage: null, description: null, labelImageUrl: null,
    barcode: prefillBarcode,
  })
  const [cellar, setCellar] = useState<CellarFields>({
    quantity: 1, purchasePrice: '', drinkFrom: '', drinkUntil: '', location: '', notes: '',
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await api.post<Wine>('/wines', wine)
      await api.post('/cellar', {
        wineId: created.id,
        quantity: cellar.quantity,
        purchasePrice: cellar.purchasePrice ? Number(cellar.purchasePrice) : null,
        purchasedAt: null,
        drinkFrom: cellar.drinkFrom ? Number(cellar.drinkFrom) : null,
        drinkUntil: cellar.drinkUntil ? Number(cellar.drinkUntil) : null,
        location: cellar.location || null,
        notes: cellar.notes || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cellar'] })
      queryClient.invalidateQueries({ queryKey: ['wines'] })
      navigate('/')
    },
  })

  const setW = (field: keyof CreateWine, value: CreateWine[keyof CreateWine]) =>
    setWine(w => ({ ...w, [field]: value }))

  return (
    <div>
      <h2>Add Wine</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} style={{ maxWidth: 540 }}>

        <div className="form-field">
          <label>Wine name *</label>
          <input required value={wine.name} onChange={e => setW('name', e.target.value)} />
        </div>

        <div className="form-field">
          <label>Winery *</label>
          <input required value={wine.winery} onChange={e => setW('winery', e.target.value)} />
        </div>

        <div className="form-field">
          <label>Varietal *</label>
          <input required value={wine.varietal} onChange={e => setW('varietal', e.target.value)}
            placeholder="e.g. Cabernet Sauvignon" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-field">
            <label>Vintage</label>
            <input type="number" min={1900} max={2100}
              value={wine.vintage ?? ''}
              onChange={e => setW('vintage', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="form-field">
            <label>Quantity</label>
            <input type="number" min={1} required value={cellar.quantity}
              onChange={e => setCellar(c => ({ ...c, quantity: Number(e.target.value) }))} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-field">
            <label>Region</label>
            <input value={wine.region} onChange={e => setW('region', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Country</label>
            <input value={wine.country} onChange={e => setW('country', e.target.value)} />
          </div>
        </div>

        <div className="form-field">
          <label>Barcode</label>
          <input value={wine.barcode ?? ''} onChange={e => setW('barcode', e.target.value || null)}
            placeholder="Scanned automatically" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-field">
            <label>Purchase price</label>
            <input type="number" min={0} step="0.01" value={cellar.purchasePrice}
              onChange={e => setCellar(c => ({ ...c, purchasePrice: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>Drink from</label>
            <input type="number" min={2000} max={2100} value={cellar.drinkFrom}
              onChange={e => setCellar(c => ({ ...c, drinkFrom: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>Drink until</label>
            <input type="number" min={2000} max={2100} value={cellar.drinkUntil}
              onChange={e => setCellar(c => ({ ...c, drinkUntil: e.target.value }))} />
          </div>
        </div>

        <div className="form-field">
          <label>Storage location</label>
          <input value={cellar.location}
            onChange={e => setCellar(c => ({ ...c, location: e.target.value }))}
            placeholder="e.g. Rack A, Bin 3" />
        </div>

        <div className="form-field">
          <label>Notes</label>
          <textarea rows={3} value={cellar.notes}
            onChange={e => setCellar(c => ({ ...c, notes: e.target.value }))} />
        </div>

        {mutation.isError && <p className="error">Failed to add wine. Please try again.</p>}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Add to Cellar'}
        </button>
      </form>
    </div>
  )
}
