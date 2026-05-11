import { X } from 'lucide-react'

interface Props {
  title: React.ReactNode
  onClose: () => void
  maxWidth?: string
  zIndex?: number
  children: React.ReactNode
}

export default function Modal({ title, onClose, maxWidth = 'max-w-[420px]', zIndex = 100, children }: Props) {
  return (
    <div
      className="fixed inset-x-0 top-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex, height: 'calc(100dvh - var(--keyboard-height, 0px))' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-surface rounded-lg p-6 w-full ${maxWidth} shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-y-auto`}
        style={{ maxHeight: 'calc(100dvh - var(--keyboard-height, 0px) - 2rem)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[1.1rem] font-semibold">{title}</h3>
          <button type="button" className="modal-close" aria-label="Lukk" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
