export type Role = 'ADMIN' | 'STAF_GUDANG' | 'STAF_AREA'

export interface User {
  id: number
  nama: string
  username: string
  role: Role
}

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  STAF_GUDANG: 'Staf Gudang',
  STAF_AREA: 'Staf Area',
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body.message ?? 'Terjadi kesalahan', res.status)
  return body as T
}
