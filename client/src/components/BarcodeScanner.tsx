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

interface Props {
  onScan: (barcode: string) => void
  paused?: boolean
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
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full max-h-[280px] object-cover rounded-lg bg-black block"
      />

      {/* Viewfinder overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-[72%] h-20 rounded shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
          <div className="absolute top-0 left-0 w-[18px] h-[18px] border-t-[2.5px] border-l-[2.5px] border-white" />
          <div className="absolute top-0 right-0 w-[18px] h-[18px] border-t-[2.5px] border-r-[2.5px] border-white" />
          <div className="absolute bottom-0 left-0 w-[18px] h-[18px] border-b-[2.5px] border-l-[2.5px] border-white" />
          <div className="absolute bottom-0 right-0 w-[18px] h-[18px] border-b-[2.5px] border-r-[2.5px] border-white" />
        </div>
      </div>

      {torchSupported && (
        <button
          type="button"
          onClick={toggleTorch}
          title={torch ? 'Turn off torch' : 'Turn on torch'}
          className={`absolute bottom-2 right-2 pointer-events-auto w-9 h-9 p-0 rounded-full flex items-center justify-center text-[1.1rem] border-0 ${
            torch ? 'bg-white/90 text-black' : 'bg-black/50 text-white'
          }`}
        >
          🔦
        </button>
      )}
    </div>
  )
}
