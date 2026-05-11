const BASE = '/api'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Called by App when a 401 can't be recovered via refresh (session expired)
let onUnauthenticated: (() => void) | null = null
export function setUnauthenticatedHandler(fn: () => void) {
  onUnauthenticated = fn
}

// Deduplicate concurrent refresh calls — only one request hits the server;
// all concurrent 401 handlers await the same promise and reuse its result.
let refreshPromise: Promise<boolean> | null = null
function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(res => res.ok)
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // send cookies automatically
  })

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return request<T>(path, init, true) // retry once with fresh cookie
    }
    onUnauthenticated?.()
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let code: string | undefined
    let message = text || res.statusText
    try {
      const body = JSON.parse(text)
      if (typeof body.message === 'string') message = body.message
      if (typeof body.code === 'string') code = body.code
    } catch { /* not JSON */ }
    throw new ApiError(res.status, code, message)
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json() as Promise<T>
}

const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  get:         <T>(path: string)                 => request<T>(path),
  post:        <T>(path: string, body: unknown)  => request<T>(path, jsonPost(body)),
  // Like post but skips the 401→refresh retry — use for auth endpoints where
  // a 401 means "wrong credentials", not "expired session".
  postDirect:  <T>(path: string, body: unknown)  => request<T>(path, jsonPost(body), true),
  postForm:    <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  patch:       <T>(path: string, body: unknown)  => request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  delete:      <T>(path: string)                 => request<T>(path, { method: 'DELETE' }),
}
