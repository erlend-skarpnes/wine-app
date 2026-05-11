import { useState } from 'react'
import type { HomeSummary } from '../api/types'
import HomeManageModal from './HomeManageModal'

interface Props {
  home: HomeSummary
  onChanged: () => void
}

export default function HomeRow({ home, onChanged }: Props) {
  const [managing, setManaging] = useState(false)

  return (
    <div data-testid="home-row" className="bg-surface rounded-xl border border-stone p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-bark">{home.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${home.isOwner ? 'bg-wine/10 text-wine' : 'bg-stone text-clay'}`}>
          {home.isOwner ? 'Eier' : 'Medlem'}
        </span>
      </div>

      <p className="text-xs text-clay">{home.memberCount} {home.memberCount === 1 ? 'medlem' : 'medlemmer'}</p>

      <button
        type="button"
        className="secondary w-full py-2 text-sm"
        onClick={() => setManaging(true)}
      >
        {home.isOwner ? 'Administrer' : 'Vis detaljer'}
      </button>

      {managing && (
        <HomeManageModal
          home={home}
          onClose={() => setManaging(false)}
          onChanged={onChanged}
        />
      )}
    </div>
  )
}
