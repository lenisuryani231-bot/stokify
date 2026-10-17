import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../lib/auth'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password, remember)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden flex-1 flex-col items-center justify-center gap-8 bg-brand text-white lg:flex">
        <div className="flex h-[196px] w-[196px] items-center justify-center rounded-[40px] bg-white text-[110px] font-bold leading-none text-brand">
          St
        </div>
        <div className="text-5xl font-semibold tracking-wide">STOKIFY</div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-[360px]">
          <div className="mb-6 flex justify-center">
            <Logo size={44} />
          </div>
          <h1 className="text-center text-3xl font-semibold">Masuk ke akun Anda</h1>
          <p className="mb-8 mt-3 text-center text-muted">Selamat datang kembali! Silakan masukkan detail Anda.</p>

          <label className="mb-1.5 block text-sm font-medium" htmlFor="username">Nama Pengguna</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan Nama Pengguna"
            autoComplete="username"
            className="mb-5 w-full rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-brand"
          />

          <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Kata Sandi</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="mb-5 w-full rounded-md border border-gray-300 px-3 py-3 outline-none focus:border-brand"
          />

          <label className="mb-6 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" />
            Ingat selama 30 hari
          </label>

          {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-dark py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
