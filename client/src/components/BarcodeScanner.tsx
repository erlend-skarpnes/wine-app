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
    let stream: MediaStream | null = null
    let controls: IScannerControls | null = null

    const timer = setTimeout(async () => {
      if (cancelled || !videoRef.current) return

      try {
        // Get the stream ourselves so we control setup order
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        if (cancelled) return

        // Apply continuous focus after the stream is playing — this is the
        // key difference vs passing constraints to getUserMedia upfront
        const track = stream.getVideoTracks()[0]
        const capabilities = track?.getCapabilities() as
          (MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] }) | undefined

        if (capabilities?.torch) setTorchSupported(true)

        if (capabilities?.focusMode?.includes('continuous')) {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          }).catch(() => {})
        }

        // Now hand the already-playing video element to ZXing
        controls = await new BrowserMultiFormatReader(HINTS)
          .decodeFromVideoElement(video, (result) => {
            if (!result || cancelled) return
            const barcode = result.getText()
            const now = Date.now()
            if (barcode === lastBarcodeRef.current && now - lastTimeRef.current < DEBOUNCE_MS) return
            lastBarcodeRef.current = barcode
            lastTimeRef.current = now
            onScanRef.current(barcode)
          })

        if (cancelled) controls.stop()
      } catch (err) {
        console.error(err)
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      controls?.stop()
      stream?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      setTorch(false)
      setTorchSupported(false)
    }
  }, [paused])

  async function tapToFocus() {
    const video = videoRef.current
    if (!video) return
    const track = (video.srcObject instanceof MediaStream)
      ? video.srcObject.getVideoTracks()[0]
      : null
    if (!track) return
    try {
      // 'auto' triggers a one-shot focus, then we switch back to continuous
      await track.applyConstraints({ advanced: [{ focusMode: 'auto' } as MediaTrackConstraintSet] })
      setTimeout(() => {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => {})
      }, 500)
    } catch { /* not supported */ }
  }

  async function toggleTorch() {
    const video = videoRef.current
    if (!video) return
    const track = (video.srcObject instanceof MediaStream)
      ? video.srcObject.getVideoTracks()[0]
      : null
    if (!track) return
    const next = !torch
    setTorch(next)
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
    } catch { /* not supported */ }
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        muted
        playsInline
        onClick={tapToFocus}
        className="w-full max-h-[280px] object-cover rounded-lg bg-black block cursor-pointer"
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
