import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type User } from './api'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string, remember: boolean) => {
    setUser(await api<User>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, remember }) }))
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
