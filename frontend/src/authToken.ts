export type JwtPayload = {
  id?: string
  role?: 'rider' | 'driver' | 'admin' | string
  exp?: number
  [key: string]: unknown
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

export function readJwtPayload(token: string | null): JwtPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2 || !parts[1]) return null

  try {
    const decoded = decodeBase64Url(parts[1])
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}
