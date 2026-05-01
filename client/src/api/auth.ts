const BASE = '/api/auth'

async function post(path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Auth request failed: ${res.status}`)
  return res.json()
}

export async function login(username: string, password: string): Promise<{ username: string }> {
  return post('/login', { username, password })
}

export async function logout(): Promise<void> {
  await post('/logout')
}

export async function me(): Promise<{ username: string }> {
  const res = await fetch(`${BASE}/me`, { credentials: 'include' })
  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}
