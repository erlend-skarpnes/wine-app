import { useState, useRef } from 'react'

export default function ScanLabelPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setStatus('Uploading...')

    const form = new FormData()
    form.append('image', file)

    try {
      const res = await fetch('/api/labels/scan', { method: 'POST', body: form })
      const data = await res.json() as { message: string }
      setStatus(data.message)
    } catch {
      setStatus('Upload failed.')
    }
  }

  return (
    <div>
      <h2>Scan Label</h2>
      <p className="muted" style={{ marginBottom: '1.25rem' }}>
        Take a photo of a wine label to automatically extract its details.
        Full label recognition will be wired up in a future update.
      </p>

      <div
        className="card"
        style={{ maxWidth: 480, textAlign: 'center', padding: '2rem', cursor: 'pointer' }}
        onClick={() => inputRef.current?.click()}
      >
        {preview
          ? <img src={preview} alt="Label preview"
              style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 'var(--radius)' }} />
          : <p className="muted">Tap to take a photo or choose an image</p>
        }
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
    </div>
  )
}
