import { useEffect, useRef, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'

interface Props {
  onScan: (barcode: string) => void
  paused?: boolean
}

const DEBOUNCE_MS = 2000

export default function BarcodeScanner({ onScan, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const lastBarcodeRef = useRef<string | null>(null)
  const lastTimeRef = useRef<number>(0)

  const handleResult = useCallback((barcode: string) => {
    const now = Date.now()
    if (barcode === lastBarcodeRef.current && now - lastTimeRef.current < DEBOUNCE_MS) return
    lastBarcodeRef.current = barcode
    lastTimeRef.current = now
    onScan(barcode)
  }, [onScan])

  useEffect(() => {
    if (paused || !videoRef.current) return

    const reader = new BrowserMultiFormatReader()

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => { if (result) handleResult(result.getText()) }
      )
      .then(controls => { controlsRef.current = controls })
      .catch(console.error)

    return () => {
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [paused, handleResult])

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
