import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatTanggal } from '../lib/format'
import { useFetch } from '../lib/useFetch'
import { useProductLookup } from '../lib/useProductLookup'
import type { FefoPreview, Meta, Paged, StockOut } from '../lib/types'
import { Card, ErrorNote, Loading } from '../components/Async'
import { FormActions, FormRow, Modal, focusNextOnEnter, inputClass, todayLocal } from '../components/Modal'
import { Pagination } from '../components/Pagination'

const PAGE_SIZE = 10

// Pratinjau batch yang akan dipakai (FEFO) berdasarkan barcode, qty, dan keterangan.
function useFefoPreview(barcode: string, qty: string, keterangan: string, ignoreId?: number) {
  const [state, setState] = useState<{ key: string; data: FefoPreview | null; error: string }>({ key: '', data: null, error: '' })
  const n = Number(qty)
  const ready = barcode.trim() !== '' && Number.isInteger(n) && n >= 1
  const key = `${barcode.trim()}|${n}|${keterangan}`

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const timer = setTimeout(() => {
      const q = new URLSearchParams({ barcode: barcode.trim(), qty: String(n), keterangan })
      if (ignoreId) q.set('ignore', String(ignoreId))
      api<FefoPreview>(`/stock-out/preview?${q}`)
        .then((data) => !cancelled && setState({ key, data, error: '' }))
        .catch((e: Error) => !cancelled && setState({ key, data: null, error: e.message }))
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [ready, key, barcode, n, keterangan, ignoreId])

  const current = ready && state.key === key
  return { data: current ? state.data : null, error: current ? state.error : '' }
}

function StockOutModal({ item, meta, onClose, onSaved }: { item: StockOut | null; meta: Meta; onClose: () => void; onSaved: () => void }) {
  const [tglKeluar, setTglKeluar] = useState(item?.tglKeluar ?? todayLocal())
  const [barcode, setBarcode] = useState(item?.barcode ?? '')
  const [qty, setQty] = useState(item ? String(item.qtyTotal) : '')
  const [keterangan, setKeterangan] = useState(item?.keterangan ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const lookup = useProductLookup(barcode)
  const preview = useFefoPreview(barcode, qty, keterangan, item?.stockOutId)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api(item ? `/stock-out/${item.stockOutId}` : '/stock-out', {
        method: item ? 'PUT' : 'POST',
        body: JSON.stringify({ tglKeluar, barcode, qty: qty === '' ? undefined : Number(qty), keterangan }),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  const kadaluwarsaText = preview.data
    ? preview.data.alokasi.map((a) => `${formatTanggal(a.tglKadaluwarsa)} (${a.qty})`).join(', ')
    : item && !preview.error
      ? formatTanggal(item.tglKadaluwarsa)
      : '-'

  return (
    <Modal title={item ? 'Edit Produk Keluar' : 'Tambahkan Produk Keluar'} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FormRow label="Tanggal Keluar" htmlFor="tglKeluar">
          <input id="tglKeluar" type="date" className={inputClass} value={tglKeluar} onChange={(e) => setTglKeluar(e.target.value)} />
        </FormRow>
        <FormRow label="Barcode" htmlFor="barcode">
          <div>
            <input
              id="barcode"
              className={inputClass}
              placeholder="Masukkan Kode Barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={focusNextOnEnter('qty')}
              autoFocus={!item}
              autoComplete="off"
            />
            {lookup.error && <p className="mt-1 text-xs text-red-600">{lookup.error}</p>}
          </div>
        </FormRow>
        <FormRow label="Nama Produk" htmlFor="nama">
          <input id="nama" className={inputClass} disabled readOnly value={lookup.product?.nama ?? '-'} />
        </FormRow>
        <FormRow label="Kategori" htmlFor="kategori">
          <input id="kategori" className={inputClass} disabled readOnly value={lookup.product?.kategori ?? '-'} />
        </FormRow>
        <FormRow label="Qty" htmlFor="qty">
          <div>
            <input id="qty" type="number" min={1} className={inputClass} placeholder="Masukkan Angka" value={qty} onChange={(e) => setQty(e.target.value)} />
            {lookup.product && <p className="mt-1 text-xs text-muted">Stok tersedia: {lookup.product.stok} {lookup.product.satuan}</p>}
          </div>
        </FormRow>
        <FormRow label="Satuan" htmlFor="satuan">
          <input id="satuan" className={inputClass} disabled readOnly value={lookup.product?.satuan ?? '-'} />
        </FormRow>
        <FormRow label="Tanggal Kadaluwarsa" htmlFor="kadaluwarsa">
          <div>
            <input id="kadaluwarsa" className={inputClass} disabled readOnly value={kadaluwarsaText} title="Dipilih otomatis oleh sistem (FEFO)" />
            <p className="mt-1 text-xs text-muted">Dipilih otomatis: batch yang paling dekat kadaluwarsa lebih dulu (FEFO).</p>
            {preview.error && <p className="mt-1 text-xs text-red-600">{preview.error}</p>}
          </div>
        </FormRow>
        <FormRow label="Keterangan" htmlFor="keterangan">
          <select id="keterangan" className={inputClass} value={keterangan} onChange={(e) => setKeterangan(e.target.value)}>
            <option value="">Masukkan Keterangan</option>
            {meta.keteranganKeluar.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </FormRow>
        {error && <ErrorNote message={error} />}
        <FormActions submitLabel={item ? 'Simpan' : 'Tambahkan'} submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  )
}

export function ProdukKeluar() {
  const { user } = useAuth()
  const canManage = user?.role === 'STAF_AREA'
  const [kategori, setKategori] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ item: StockOut | null } | null>(null)

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
  if (kategori) query.set('kategori', kategori)
  const meta = useFetch<Meta>('/meta')
  const list = useFetch<Paged<StockOut>>(`/stock-out?${query}`)
  const headers = ['Tanggal Keluar', 'Barcode', 'Nama Produk', 'Kategori', 'Qty', 'Satuan', 'Tanggal Kadaluwarsa', 'Keterangan', ...(canManage ? ['Aksi'] : [])]

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Produk Keluar</h1>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <select
            aria-label="Filter kategori"
            className={`${inputClass} !w-auto`}
            value={kategori}
            onChange={(e) => {
              setKategori(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Semua Kategori</option>
            {meta.data?.kategori.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          {canManage && meta.data && (
            <button onClick={() => setModal({ item: null })} className="flex items-center gap-2 rounded-md border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-sky-50">
              <Plus size={18} /> Produk Keluar
            </button>
          )}
        </div>

        {list.error && <ErrorNote message={list.error} />}
        {list.loading && !list.data ? (
          <Loading />
        ) : (
          list.data && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="px-3 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.items.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="px-3 py-3">{formatTanggal(r.tglKeluar)}</td>
                        <td className="px-3 py-3 text-muted">{r.barcode}</td>
                        <td className="px-3 py-3">{r.nama}</td>
                        <td className="px-3 py-3 text-muted">{r.kategori}</td>
                        <td className="px-3 py-3">{r.qty}</td>
                        <td className="px-3 py-3">{r.satuan}</td>
                        <td className="px-3 py-3">{formatTanggal(r.tglKadaluwarsa)}</td>
                        <td className="px-3 py-3">{r.keterangan}</td>
                        {canManage && (
                          <td className="px-3 py-3">
                            <button aria-label={`Edit ${r.nama}`} onClick={() => setModal({ item: r })} className="text-amber-500 hover:text-amber-600">
                              <Pencil size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {list.data.items.length === 0 && (
                      <tr>
                        <td colSpan={headers.length} className="px-3 py-8 text-center text-muted">
                          Belum ada produk keluar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={list.data.page} pageSize={PAGE_SIZE} total={list.data.total} noun="baris" onChange={setPage} />
            </>
          )
        )}
      </Card>

      {modal && meta.data && (
        <StockOutModal
          item={modal.item}
          meta={meta.data}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            list.reload()
          }}
        />
      )}
    </div>
  )
}
