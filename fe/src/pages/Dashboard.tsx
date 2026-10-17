import { Link } from 'react-router-dom'
import { useFetch } from '../lib/useFetch'
import type { Dashboard as DashboardData, StockSummary } from '../lib/types'
import { formatTanggal, formatTanggalPanjang } from '../lib/format'
import { Card, ErrorNote, Loading } from '../components/Async'
import { DonutChart, donutColors } from '../components/DonutChart'
import { StatusBadge } from '../components/StatusBadge'

function StokItem({ p }: { p: StockSummary }) {
  const pct = Math.min(100, Math.round((p.stok / Math.max(p.minStok * 2, 1)) * 100))
  const bar = p.status === 'KRITIS' ? 'bg-red-500' : p.status === 'PERINGATAN' ? 'bg-amber-500' : 'bg-green-600'
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{p.nama}</div>
          <div className="text-sm text-muted">
            Stok {p.stok} / min {p.minStok} {p.satuan}
          </div>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}

function SisaHariBadge({ hari }: { hari: number }) {
  const lewat = hari <= 0
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${lewat ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
      {lewat ? 'Kadaluwarsa' : `${hari} Hari`}
    </span>
  )
}

function StokList({ title, to, data }: { title: string; to: string; data: DashboardData['stokMenipis'] }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link to={to} className="text-xs font-medium text-brand">
          Lihat Semua
        </Link>
      </div>
      {data.items.length === 0 ? (
        <p className="py-4 text-sm text-muted">Tidak ada produk.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.items.map((p) => (
            <StokItem key={p.id} p={p} />
          ))}
        </ul>
      )}
    </Card>
  )
}

export function Dashboard() {
  const { data, error, loading } = useFetch<DashboardData>('/dashboard')

  if (loading && !data) return <Loading />
  if (error && !data) return <ErrorNote message={error} />
  if (!data) return null

  const r = data.ringkasan
  const cards = [
    { label: 'Total Produk', value: r.totalProduk, note: `${r.jumlahKategori} kategori`, border: 'border-brand', text: 'text-brand' },
    { label: 'Produk Masuk Hari Ini', value: r.masukHariIni, note: 'unit diterima', border: 'border-green-600', text: 'text-green-600' },
    { label: 'Produk Keluar Hari Ini', value: r.keluarHariIni, note: 'unit keluar', border: 'border-red-600', text: 'text-red-600' },
    { label: 'Mendekati Kadaluwarsa', value: r.mendekatiKadaluwarsa, note: 'batch, sisa ≤ 3 hari atau lewat', border: 'border-amber-500', text: 'text-amber-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dasbor</h1>
        <p className="text-sm text-muted">{formatTanggalPanjang(data.tanggal)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-lg border-l-4 bg-white p-4 ${c.border}`}>
            <div className="text-sm">{c.label}</div>
            <div className={`text-3xl font-bold ${c.text}`}>{c.value}</div>
            <div className="text-xs text-muted">{c.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr_1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">Persentase Kategori</h2>
          <DonutChart values={data.kategori.map((k) => k.jumlah)} total={r.totalProduk} label="Produk" />
          <ul className="mt-4 space-y-1.5 text-sm">
            {data.kategori.map((k, i) => (
              <li key={k.nama} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: donutColors[i % donutColors.length] }} />
                  {k.nama}
                </span>
                <span className="text-muted">{k.persen.toLocaleString('id-ID')}%</span>
              </li>
            ))}
          </ul>
        </Card>
        <StokList title="Stok Menipis" to="/data-produk?status=MENIPIS" data={data.stokMenipis} />
        <StokList title="Stok Aman" to="/data-produk?status=AMAN" data={data.stokAman} />
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Produk yang Harus Diperhatikan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                {['Barcode', 'Nama Produk', 'Kategori', 'Stok', 'Satuan', 'Tanggal Kadaluwarsa', 'Sisa Kadaluwarsa'].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.perhatian.items.map((b) => (
                <tr key={b.id} className="border-b border-gray-100">
                  <td className="px-3 py-3 text-muted">{b.barcode}</td>
                  <td className="px-3 py-3">{b.nama}</td>
                  <td className="px-3 py-3 text-muted">{b.kategori}</td>
                  <td className="px-3 py-3">{b.stok}</td>
                  <td className="px-3 py-3">{b.satuan}</td>
                  <td className="px-3 py-3">{formatTanggal(b.tglKadaluwarsa)}</td>
                  <td className="px-3 py-3">
                    <SisaHariBadge hari={b.sisaHari} />
                  </td>
                </tr>
              ))}
              {data.perhatian.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted">
                    Tidak ada produk yang mendekati kadaluwarsa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.perhatian.total > data.perhatian.items.length && (
          <p className="mt-3 text-xs text-muted">
            Menampilkan {data.perhatian.items.length} dari {data.perhatian.total} batch, urut sisa hari terkecil.
          </p>
        )}
      </Card>
    </div>
  )
}
