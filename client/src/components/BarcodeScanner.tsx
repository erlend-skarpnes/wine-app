import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ]],
])

interface Props {
  onScan: (barcode: string) => void
  paused?: boolean
}

const DEBOUNCE_MS = 2000

function getVideoTrack(video: HTMLVideoElement): MediaStreamTrack | null {
  const stream = video.srcObject instanceof MediaStream ? video.srcObject : null
  return stream?.getVideoTracks()[0] ?? null
}

async function applyTorch(video: HTMLVideoElement, on: boolean) {
  const track = getVideoTrack(video)
  if (!track) return
  try {
    await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
  } catch {
    // torch not supported on this device/browser — silently ignore
  }
}

export default function BarcodeScanner({ onScan, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onScanRef = useRef(onScan)
  const lastBarcodeRef = useRef<string | null>(null)
  const lastTimeRef = useRef<number>(0)
  const [torch, setTorch] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    if (paused || !videoRef.current) return

    let cancelled = false
    let controls: IScannerControls | null = null

    // Defer with setTimeout so React Strict Mode's synchronous cleanup can cancel
    // the timeout before it fires, preventing two readers from starting on the same
    // video element and racing each other.
    const timer = setTimeout(() => {
      if (cancelled || !videoRef.current) return

      new BrowserMultiFormatReader(HINTS)
        .decodeFromConstraints(
          {
            video: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
            },
          },
          videoRef.current,
          (result) => {
            if (!result || cancelled) return
            const barcode = result.getText()
            const now = Date.now()
            if (barcode === lastBarcodeRef.current && now - lastTimeRef.current < DEBOUNCE_MS) return
            lastBarcodeRef.current = barcode
            lastTimeRef.current = now
            onScanRef.current(barcode)
          }
        )
        .then(c => {
          if (cancelled) { c.stop(); return }
          controls = c
          // Check torch support after stream starts
          if (videoRef.current) {
            const track = getVideoTrack(videoRef.current)
            const capabilities = track?.getCapabilities() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
            if (capabilities?.torch) setTorchSupported(true)
          }
        })
        .catch(console.error)
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      controls?.stop()
      setTorch(false)
      setTorchSupported(false)
    }
  }, [paused])

  async function toggleTorch() {
    if (!videoRef.current) return
    const next = !torch
    setTorch(next)
    await applyTorch(videoRef.current, next)
  }

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          maxHeight: 280,
          objectFit: 'cover',
          borderRadius: 'var(--radius)',
          background: '#000',
          display: 'block',
        }}
      />
      {/* Viewfinder overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Clear scan window punches through the dark overlay via box-shadow */}
        <div style={{ position: 'relative', width: '72%', height: 80, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', borderRadius: 4 }}>
          <div style={{ position: 'absolute', top: 0,    left: 0,  width: 18, height: 18, borderTop: '2.5px solid #fff', borderLeft:  '2.5px solid #fff' }} />
          <div style={{ position: 'absolute', top: 0,    right: 0, width: 18, height: 18, borderTop: '2.5px solid #fff', borderRight: '2.5px solid #fff' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0,  width: 18, height: 18, borderBottom: '2.5px solid #fff', borderLeft:  '2.5px solid #fff' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderBottom: '2.5px solid #fff', borderRight: '2.5px solid #fff' }} />
        </div>
      </div>
      {torchSupported && (
        <button
          type="button"
          onClick={toggleTorch}
          title={torch ? 'Turn off torch' : 'Turn on torch'}
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.5rem',
            background: torch ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
            color: torch ? '#000' : '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '2.25rem',
            height: '2.25rem',
            fontSize: '1.1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🔦
        </button>
      )}
    </div>
  )
}
