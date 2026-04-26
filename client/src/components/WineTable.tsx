import type { CellarEntry } from '../api/types'

interface Props {
  entries: CellarEntry[]
  onSelect: (entry: CellarEntry) => void
}

export default function WineTable({ entries, onSelect }: Props) {
  return (
    <table className="w-full border-collapse text-[0.9rem] wine-table">
      <thead>
        <tr>
          <th className="text-left text-xs text-clay font-semibold px-3 py-2 border-b border-stone">Vin</th>
          <th className="text-right text-xs text-clay font-semibold px-3 py-2 border-b border-stone">Flasker</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(entry => (
          <tr key={entry.barcode} onClick={() => onSelect(entry)} className="cursor-pointer">
            <td className="px-3 py-3 border-b border-stone align-middle">{entry.name ?? entry.barcode}</td>
            <td className="px-3 py-3 border-b border-stone align-middle text-right">
              <span className="inline-block bg-wine text-white rounded-full px-2.5 py-0.5 text-xs">{entry.quantity}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
