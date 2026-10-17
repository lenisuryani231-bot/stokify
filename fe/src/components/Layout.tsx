import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle, Bell, Home, LogOut, Package, Settings, UserCircle, Search } from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '../lib/auth'
import { roleLabel } from '../lib/api'

const menu = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/data-produk', label: 'Data Produk', icon: Package },
  { to: '/pemasok', label: 'Pemasok', icon: UserCircle },
  { to: '/produk-masuk', label: 'Produk Masuk', icon: ArrowDownCircle },
  { to: '/produk-keluar', label: 'Produk Keluar', icon: ArrowUpCircle },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] ${
    isActive ? 'font-medium text-brand' : 'text-ink/80 hover:bg-gray-50'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[280px] shrink-0 flex-col justify-between border-r border-gray-200 bg-white p-6">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <Logo size={44} />
            <span className="text-xl font-semibold tracking-wide text-brand">STOKIFY</span>
          </div>
          <nav className="flex flex-col gap-1">
            {menu.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                <Icon size={20} /> {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-1">
          <NavLink to="/pengaturan" className={linkClass}>
            <Settings size={20} /> Pengaturan
          </NavLink>
          <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] text-ink/80 hover:bg-gray-50">
            <LogOut size={20} /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-6">
          <div className="relative w-[400px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              placeholder="Cari produk, pemasok, pesanan"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const q = e.currentTarget.value.trim()
                navigate(q ? `/data-produk?q=${encodeURIComponent(q)}` : '/data-produk')
              }}
              className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="flex items-center gap-5">
            <Bell size={20} className="text-muted" />
            <div className="text-right text-sm leading-tight">
              <div className="font-medium">{user?.nama}</div>
              <div className="text-muted">{user && roleLabel[user.role]}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
