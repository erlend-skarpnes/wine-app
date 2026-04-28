const BASE = '/api'

let getToken: (() => Promise<string>) | null = null

export function setTokenGetter(fn: () => Promise<string>) {
  getToken = fn
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }

  if (getToken) {
    const token = await getToken()
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get:  <T>(path: string)                => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
}
