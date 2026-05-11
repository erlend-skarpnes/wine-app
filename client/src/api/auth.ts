import { api } from './client'

export async function login(username: string, password: string): Promise<{ username: string; isAdmin: boolean }> {
  return api.postDirect('/auth/login', { username, password })
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function register(inviteToken: string, username: string, password: string): Promise<{ username: string }> {
  return api.postDirect('/auth/register', { inviteToken, username, password })
}

export async function me(): Promise<{ username: string; isAdmin: boolean }> {
  return api.get('/auth/me')
}
