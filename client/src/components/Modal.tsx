import { X } from 'lucide-react'

interface Props {
  title: React.ReactNode
  onClose: () => void
  maxWidth?: string
  children: React.ReactNode
}

export default function Modal({ title, onClose, maxWidth = 'max-w-[420px]', children }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" className={`bg-surface rounded-lg p-6 w-full ${maxWidth} shadow-[0_8px_32px_rgba(0,0,0,0.2)]`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[1.1rem] font-semibold">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
