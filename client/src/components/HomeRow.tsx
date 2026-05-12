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
    <div data-testid="home-row" className="flex items-center gap-3 py-3 border-b border-stone last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-bark text-sm font-medium truncate">{home.name}</p>
        <p className="text-clay text-[0.7rem] mt-0.5">
          {home.memberCount} {home.memberCount === 1 ? 'medlem' : 'medlemmer'}
        </p>
      </div>

      <span className={`text-[0.67rem] px-2 py-0.5 rounded-full shrink-0 ${home.isOwner ? 'bg-wine/10 text-wine' : 'bg-stone text-clay'}`}>
        {home.isOwner ? 'Eier' : 'Medlem'}
      </span>

      <button
        type="button"
        className="secondary text-xs px-3 py-1.5 shrink-0"
        onClick={() => setManaging(true)}
      >
        {home.isOwner ? 'Administrer' : 'Vis'}
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
