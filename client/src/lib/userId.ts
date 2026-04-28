const KEY = 'userId'

export function setUserId(id: string) {
  localStorage.setItem(KEY, id)
}

export function getUserId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
