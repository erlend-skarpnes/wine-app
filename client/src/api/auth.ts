import { api } from './client'

const BASE = '/api/auth'

async function post(path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = new Error(`${res.status}`)
    if (res.headers.get('content-type')?.includes('json')) {
      const data = await res.json().catch(() => ({}))
      if (data.message) err.message = data.message
    }
    throw err
  }
  return res.json()
}

export async function login(username: string, password: string): Promise<{ username: string; isAdmin: boolean }> {
  return post('/login', { username, password })
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' })
}

export async function register(inviteToken: string, username: string, password: string): Promise<{ username: string }> {
  return post('/register', { inviteToken, username, password })
}

export async function me(): Promise<{ username: string; isAdmin: boolean }> {
  return api.get('/auth/me')
}
