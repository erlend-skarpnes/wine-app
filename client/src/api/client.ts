const BASE = '/api'

// Called by App when a 401 can't be recovered via refresh (session expired)
let onUnauthenticated: (() => void) | null = null
export function setUnauthenticatedHandler(fn: () => void) {
  onUnauthenticated = fn
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // send cookies automatically
  })

  if (res.status === 401 && !isRetry) {
    // Try to refresh the session
    const refreshed = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (refreshed.ok) {
      return request<T>(path, init, true) // retry once with fresh cookie
    }
    onUnauthenticated?.()
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get:      <T>(path: string)                 => request<T>(path),
  post:     <T>(path: string, body: unknown)  => request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  patch:    <T>(path: string, body: unknown)  => request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  delete:   <T>(path: string)                 => request<T>(path, { method: 'DELETE' }),
}
