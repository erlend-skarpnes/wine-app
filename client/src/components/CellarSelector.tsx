import { useCellar } from '../context/CellarContext'

export default function CellarSelector() {
  const { cellars, activeCellar, setActiveCellar } = useCellar()

  if (cellars.length === 0) return null

  if (cellars.length === 1) {
    return (
      <p className="text-sm font-medium text-bark mb-4">{activeCellar?.name}</p>
    )
  }

  return (
    <div className="mb-4">
      <select
        value={activeCellar?.id ?? ''}
        onChange={e => {
          const cellar = cellars.find(c => c.id === parseInt(e.target.value, 10))
          if (cellar) setActiveCellar(cellar)
        }}
        className="border border-stone rounded-lg px-3 py-2 text-sm bg-surface text-bark focus:outline-none focus:border-wine font-medium"
      >
        {cellars.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
