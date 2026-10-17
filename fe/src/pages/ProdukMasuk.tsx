import { useState, type FormEvent } from 'react'
import { Lock, Pencil, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatTanggal } from '../lib/format'
import { useFetch } from '../lib/useFetch'
import { useProductLookup } from '../lib/useProductLookup'
import type { Meta, Paged, StockIn, Supplier } from '../lib/types'
import { Card, ErrorNote, Loading } from '../components/Async'
import { FormActions, FormRow, Modal, focusNextOnEnter, inputClass, todayLocal } from '../components/Modal'
import { Pagination } from '../components/Pagination'

const PAGE_SIZE = 10

function StockInModal({ item, onClose, onSaved }: { item: StockIn | null; onClose: () => void; onSaved: () => void }) {
  const suppliers = useFetch<Paged<Supplier>>('/suppliers?pageSize=100')
  const [tglTerima, setTglTerima] = useState(item?.tglTerima ?? todayLocal())
  const [barcode, setBarcode] = useState(item?.barcode ?? '')
  const [qty, setQty] = useState(item ? String(item.qty) : '')
  const [tglKadaluwarsa, setTglKadaluwarsa] = useState(item?.tglKadaluwarsa ?? '')
  const [supplierId, setSupplierId] = useState(item?.supplierId ? String(item.supplierId) : '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const lookup = useProductLookup(barcode)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api(item ? `/stock-in/${item.id}` : '/stock-in', {
        method: item ? 'PUT' : 'POST',
        body: JSON.stringify({
          tglTerima,
          barcode,
          qty: qty === '' ? undefined : Number(qty),
          tglKadaluwarsa,
          supplierId: supplierId ? Number(supplierId) : null,
        }),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={item ? 'Edit Produk Masuk' : 'Tambahkan Produk Masuk'} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FormRow label="Tanggal Terima" htmlFor="tglTerima">
          <input id="tglTerima" type="date" className={inputClass} value={tglTerima} onChange={(e) => setTglTerima(e.target.value)} />
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
          <input id="qty" type="number" min={1} className={inputClass} placeholder="Masukkan Angka" value={qty} onChange={(e) => setQty(e.target.value)} />
        </FormRow>
        <FormRow label="Satuan" htmlFor="satuan">
          <input id="satuan" className={inputClass} disabled readOnly value={lookup.product?.satuan ?? '-'} />
        </FormRow>
        <FormRow label="Tanggal Kadaluwarsa" htmlFor="tglKadaluwarsa">
          <input id="tglKadaluwarsa" type="date" className={inputClass} value={tglKadaluwarsa} onChange={(e) => setTglKadaluwarsa(e.target.value)} />
        </FormRow>
        <FormRow label="Pemasok" htmlFor="supplierId">
          <select id="supplierId" className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Pilih Pemasok (opsional)</option>
            {suppliers.data?.items.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </FormRow>
        {error && <ErrorNote message={error} />}
        <FormActions submitLabel={item ? 'Simpan' : 'Tambahkan'} submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  )
}

export function ProdukMasuk() {
  const { user } = useAuth()
  const canManage = user?.role === 'STAF_GUDANG'
  const [kategori, setKategori] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ item: StockIn | null } | null>(null)

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
  if (kategori) query.set('kategori', kategori)
  const meta = useFetch<Meta>('/meta')
  const list = useFetch<Paged<StockIn>>(`/stock-in?${query}`)
  const headers = ['Tanggal Terima', 'Barcode', 'Nama Produk', 'Kategori', 'Qty', 'Satuan', 'Tanggal Kadaluwarsa', 'Pemasok', ...(canManage ? ['Aksi'] : [])]

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Produk Masuk</h1>
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
          {canManage && (
            <button onClick={() => setModal({ item: null })} className="flex items-center gap-2 rounded-md border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-sky-50">
              <Plus size={18} /> Produk Masuk
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
                        <td className="px-3 py-3">{formatTanggal(r.tglTerima)}</td>
                        <td className="px-3 py-3 text-muted">{r.barcode}</td>
                        <td className="px-3 py-3">{r.nama}</td>
                        <td className="px-3 py-3 text-muted">{r.kategori}</td>
                        <td className="px-3 py-3">{r.qty}</td>
                        <td className="px-3 py-3">{r.satuan}</td>
                        <td className="px-3 py-3">{formatTanggal(r.tglKadaluwarsa)}</td>
                        <td className="px-3 py-3 text-muted">{r.pemasok ?? '-'}</td>
                        {canManage && (
                          <td className="px-3 py-3">
                            {r.bisaDiedit ? (
                              <button aria-label={`Edit ${r.nama}`} onClick={() => setModal({ item: r })} className="text-amber-500 hover:text-amber-600">
                                <Pencil size={16} />
                              </button>
                            ) : (
                              <span title="Sudah dipakai produk keluar, tidak bisa diubah" className="text-gray-400">
                                <Lock size={16} />
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {list.data.items.length === 0 && (
                      <tr>
                        <td colSpan={headers.length} className="px-3 py-8 text-center text-muted">
                          Belum ada produk masuk.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={list.data.page} pageSize={PAGE_SIZE} total={list.data.total} noun="penerimaan" onChange={setPage} />
            </>
          )
        )}
      </Card>

      {modal && (
        <StockInModal
          item={modal.item}
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
