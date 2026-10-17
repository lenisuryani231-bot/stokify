import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { DataProduk } from './pages/DataProduk'
import { Pemasok } from './pages/Pemasok'
import { ProdukMasuk } from './pages/ProdukMasuk'
import { ProdukKeluar } from './pages/ProdukKeluar'
import { Pengaturan } from './pages/Pengaturan'

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-muted">Memuat...</div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="data-produk" element={<DataProduk />} />
              <Route path="pemasok" element={<Pemasok />} />
              <Route path="produk-masuk" element={<ProdukMasuk />} />
              <Route path="produk-keluar" element={<ProdukKeluar />} />
              <Route path="pengaturan" element={<Pengaturan />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
