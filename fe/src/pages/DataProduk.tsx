import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useFetch } from '../lib/useFetch'
import type { Meta, Paged, Product } from '../lib/types'
import { Card, ErrorNote, Loading } from '../components/Async'
import { FormActions, FormRow, Modal, inputClass } from '../components/Modal'
import { Pagination } from '../components/Pagination'
import { StatusBadge } from '../components/StatusBadge'

const PAGE_SIZE = 10

const statusOptions = [
  { value: 'AMAN', label: 'Aman' },
  { value: 'PERINGATAN', label: 'Peringatan' },
  { value: 'KRITIS', label: 'Kritis' },
  { value: 'MENIPIS', label: 'Menipis (Peringatan + Kritis)' },
]

interface FormState {
  barcode: string
  nama: string
  kategori: string
  satuan: string
  minStok: string
}

function ProductModal({ product, meta, onClose, onSaved }: { product: Product | null; meta: Meta; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>({
    barcode: product?.barcode ?? '',
    nama: product?.nama ?? '',
    kategori: product?.kategori ?? '',
    satuan: product?.satuan ?? '',
    minStok: product ? String(product.minStok) : '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api(product ? `/products/${product.id}` : '/products', {
        method: product ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, minStok: form.minStok === '' ? undefined : Number(form.minStok) }),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={product ? 'Edit Data Produk' : 'Tambahkan Produk Baru'} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormRow label="Barcode" htmlFor="barcode">
          <input id="barcode" className={inputClass} value={form.barcode} onChange={set('barcode')} />
        </FormRow>
        <FormRow label="Nama Produk" htmlFor="nama">
          <input id="nama" className={inputClass} placeholder="Masukkan Nama Produk" value={form.nama} onChange={set('nama')} />
        </FormRow>
        <FormRow label="Kategori" htmlFor="kategori">
          <select id="kategori" className={inputClass} value={form.kategori} onChange={set('kategori')}>
            <option value="">Pilih Kategori Produk</option>
            {meta.kategori.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Stok" htmlFor="stok">
          <input id="stok" className={inputClass} disabled value={product ? product.stok : '-'} title="Stok berubah lewat Produk Masuk dan Produk Keluar" readOnly />
        </FormRow>
        <FormRow label="Satuan" htmlFor="satuan">
          <select id="satuan" className={inputClass} value={form.satuan} onChange={set('satuan')}>
            <option value="">Pilih Satuan Produk</option>
            {meta.satuan.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Min Stok" htmlFor="minStok">
          <input id="minStok" type="number" min={0} className={inputClass} placeholder="Masukkan Stok Terkecil" value={form.minStok} onChange={set('minStok')} />
        </FormRow>
        {error && <ErrorNote message={error} />}
        <FormActions submitLabel={product ? 'Simpan' : 'Tambahkan'} submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  )
}

export function DataProduk() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [params, setParams] = useSearchParams()
  const kategori = params.get('kategori') ?? ''
  const status = params.get('status') ?? ''
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? '1') || 1

  const [modal, setModal] = useState<{ product: Product | null } | null>(null)

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
  if (kategori) query.set('kategori', kategori)
  if (status) query.set('status', status)
  if (q) query.set('q', q)

  const meta = useFetch<Meta>('/meta')
  const list = useFetch<Paged<Product>>(`/products?${query}`)

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Data Produk</h1>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <select aria-label="Filter kategori" className={`${inputClass} !w-auto`} value={kategori} onChange={(e) => update({ kategori: e.target.value })}>
              <option value="">Semua Kategori</option>
              {meta.data?.kategori.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <select aria-label="Filter status" className={`${inputClass} !w-auto`} value={status} onChange={(e) => update({ status: e.target.value })}>
              <option value="">Filter berdasarkan Status</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {q && (
              <button onClick={() => update({ q: '' })} className="rounded-md bg-sky-50 px-3 text-sm text-brand-dark">
                Pencarian: {q} ✕
              </button>
            )}
          </div>
          {isAdmin && meta.data && (
            <button onClick={() => setModal({ product: null })} className="flex items-center gap-2 rounded-md border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-sky-50">
              <Plus size={18} /> Produk Baru
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
                      {['Barcode', 'Nama Produk', 'Kategori', 'Stok', 'Satuan', 'Min Stok', 'Status', ...(isAdmin ? ['Aksi'] : [])].map((h) => (
                        <th key={h} className="px-3 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.items.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="px-3 py-3 text-muted">{p.barcode}</td>
                        <td className="px-3 py-3">{p.nama}</td>
                        <td className="px-3 py-3 text-muted">{p.kategori}</td>
                        <td className="px-3 py-3">{p.stok}</td>
                        <td className="px-3 py-3">{p.satuan}</td>
                        <td className="px-3 py-3">{p.minStok}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={p.status} />
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-3">
                            <button aria-label={`Edit ${p.nama}`} onClick={() => setModal({ product: p })} className="text-amber-500 hover:text-amber-600">
                              <Pencil size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {list.data.items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-muted">
                          Tidak ada produk yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={list.data.page} pageSize={PAGE_SIZE} total={list.data.total} noun="produk" onChange={(p) => update({ page: String(p) })} />
            </>
          )
        )}
      </Card>

      {modal && meta.data && (
        <ProductModal
          product={modal.product}
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
