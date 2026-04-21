import { useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'

interface Props {
  onScan: (barcode: string) => void
  paused?: boolean
}

const DEBOUNCE_MS = 2000

export default function BarcodeScanner({ onScan, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onScanRef = useRef(onScan)
  const lastBarcodeRef = useRef<string | null>(null)
  const lastTimeRef = useRef<number>(0)

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

      new BrowserMultiFormatReader()
        .decodeFromConstraints(
          { video: { facingMode: 'environment' } },
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
          if (cancelled) c.stop()
          else controls = c
        })
        .catch(console.error)
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      controls?.stop()
    }
  }, [paused])

  return (
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
  )
}
