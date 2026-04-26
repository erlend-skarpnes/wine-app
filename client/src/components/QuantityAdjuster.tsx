interface Props {
  value: number
  onChange: (delta: 1 | -1) => void
  min?: number
}

export default function QuantityAdjuster({ value, onChange, min = 0 }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onChange(-1)}
        disabled={value <= min}
        className="w-10 h-10 p-0 text-xl shrink-0"
      >
        −
      </button>
      <span className="text-2xl font-bold min-w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(1)}
        className="w-10 h-10 p-0 text-xl shrink-0"
      >
        +
      </button>
    </div>
  )
}
