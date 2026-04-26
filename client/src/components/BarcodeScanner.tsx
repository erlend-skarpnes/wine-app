import { useEffect, useRef, useState } from 'react'
import ViewfinderOverlay from './ViewfinderOverlay'
import Modal from './Modal'
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
const CAMERA_KEY = 'preferredCameraId'

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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [showCameraPicker, setShowCameraPicker] = useState(false)
  const [preferredDeviceId, setPreferredDeviceId] = useState<string | null>(
    () => localStorage.getItem(CAMERA_KEY)
  )

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    if (paused || !videoRef.current) return

    let cancelled = false
    let stream: MediaStream | null = null
    let controls: IScannerControls | null = null
    let refocusInterval: ReturnType<typeof setInterval> | null = null

    const timer = setTimeout(async () => {
      if (cancelled || !videoRef.current) return

      try {
        const videoConstraint: MediaTrackConstraints = preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }

        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        if (cancelled) return

        const track = stream.getVideoTracks()[0]
        const capabilities = track?.getCapabilities() as
          (MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] }) | undefined

        if (capabilities?.torch) setTorchSupported(true)

        // Enumerate devices after getUserMedia so labels are populated
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = allDevices.filter(d => d.kind === 'videoinput')
        if (!cancelled) setDevices(videoInputs)

        const applyFocus = (mode: string) =>
          track.applyConstraints({ advanced: [{ focusMode: mode } as MediaTrackConstraintSet] }).catch(() => {})

        await applyFocus('continuous')
        setTimeout(() => {
          if (cancelled) return
          applyFocus('auto').then(() => {
            setTimeout(() => { if (!cancelled) applyFocus('continuous') }, 800)
          })
        }, 300)

        refocusInterval = setInterval(() => {
          if (cancelled) { clearInterval(refocusInterval!); return }
          applyFocus('auto').then(() => {
            setTimeout(() => { if (!cancelled) applyFocus('continuous') }, 800)
          })
        }, 5000)

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
        if (preferredDeviceId) {
          localStorage.removeItem(CAMERA_KEY)
          setPreferredDeviceId(null)
        } else {
          console.error(err)
        }
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (refocusInterval) clearInterval(refocusInterval)
      controls?.stop()
      stream?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      setTorch(false)
      setTorchSupported(false)
      setDevices([])
    }
  }, [paused, preferredDeviceId])

  async function tapToFocus() {
    const video = videoRef.current
    if (!video) return
    const track = (video.srcObject instanceof MediaStream)
      ? video.srcObject.getVideoTracks()[0]
      : null
    if (!track) return
    try {
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

  function selectCamera(deviceId: string) {
    localStorage.setItem(CAMERA_KEY, deviceId)
    setPreferredDeviceId(deviceId)
    setShowCameraPicker(false)
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          muted
          playsInline
          onClick={tapToFocus}
          className="w-full max-h-[280px] object-cover bg-black block cursor-pointer"
        />

        <ViewfinderOverlay />

        {torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            title={torch ? 'Slå av lommelykten' : 'Slå på lommelykten'}
            className={`absolute bottom-2 right-2 pointer-events-auto w-9 h-9 p-0 rounded-full flex items-center justify-center text-[1.1rem] border-0 ${
              torch ? 'bg-white/90 text-black' : 'bg-black/50 text-white'
            }`}
          >
            🔦
          </button>
        )}
      </div>

      {devices.length > 1 && (
        <button
          type="button"
          className="secondary w-full mt-2"
          onClick={() => setShowCameraPicker(true)}
        >
          Bytt kamera
        </button>
      )}

      {showCameraPicker && (
        <Modal title="Velg kamera" onClose={() => setShowCameraPicker(false)}>
          <ul className="flex flex-col gap-1">
            {devices.map((device, i) => {
              const isActive = device.deviceId === preferredDeviceId
              return (
                <li key={device.deviceId}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm ${
                      isActive
                        ? 'bg-wine text-white'
                        : 'secondary'
                    }`}
                    onClick={() => selectCamera(device.deviceId)}
                  >
                    {device.label || `Kamera ${i + 1}`}
                  </button>
                </li>
              )
            })}
          </ul>
        </Modal>
      )}
    </>
  )
}
