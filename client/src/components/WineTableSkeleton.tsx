const NAME_WIDTHS  = ['72%', '58%', '85%', '65%', '78%', '55%', '70%', '62%']
const SUB_WIDTHS   = ['38%', '45%', '28%', '42%', '35%', '48%', '32%', '40%']
const STRIPE_TONES = ['#d4c4c6', '#c8bfb0', '#cfc5c0', '#d0c8b8', '#cfc0c0', '#c8c0b0']

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="relative flex items-center pl-6 pr-5 py-3.5 border-b border-stone"
      style={{ animation: `entrySlideIn 0.3s ease-out ${index * 45}ms both` }}
    >
      <div
        className="absolute left-0 rounded-r-full"
        style={{ background: STRIPE_TONES[index % STRIPE_TONES.length], width: '3px', top: '18%', bottom: '18%' }}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div
          className="shimmer h-[1.05rem] rounded"
          style={{ width: NAME_WIDTHS[index % NAME_WIDTHS.length], animationDelay: `${index * 30}ms` }}
        />
        <div
          className="shimmer h-[0.73rem] rounded"
          style={{ width: SUB_WIDTHS[index % SUB_WIDTHS.length], animationDelay: `${index * 30 + 80}ms` }}
        />
      </div>

      <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
        <div className="shimmer rounded" style={{ width: '1.4rem', height: '1.6rem', animationDelay: `${index * 30 + 40}ms` }} />
        <div className="shimmer rounded" style={{ width: '1rem', height: '0.6rem', animationDelay: `${index * 30 + 120}ms` }} />
      </div>
    </div>
  )
}

export default function WineTableSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="-mx-6" aria-busy="true" aria-label="Laster vinliste">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  )
}
