import { useEffect, useRef } from 'react'

interface Props {
  onCapture: (blob: Blob) => void
  disabled?: boolean
}

export default function LabelCamera({ onCapture, disabled = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let active = true

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (!active) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(console.error)

    return () => {
      active = false
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  function capture() {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(blob => { if (blob) onCapture(blob) }, 'image/jpeg', 0.85)
  }

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          maxHeight: 280,
          objectFit: 'cover',
          borderRadius: 'var(--radius)',
          background: '#000',
          display: 'block',
        }}
      />
      <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
        <button type="button" onClick={capture} disabled={disabled}>
          Capture label
        </button>
      </div>
    </div>
  )
}
