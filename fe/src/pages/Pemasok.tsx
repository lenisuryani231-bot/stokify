import { useState, type FormEvent } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useFetch } from '../lib/useFetch'
import type { Paged, Supplier } from '../lib/types'
import { Card, ErrorNote, Loading } from '../components/Async'
import { FormActions, FormRow, Modal, inputClass } from '../components/Modal'
import { Pagination } from '../components/Pagination'

const PAGE_SIZE = 10

type FormState = Omit<Supplier, 'id'>

const fields: { key: keyof FormState; label: string; placeholder: string; type?: string }[] = [
  { key: 'nama', label: 'Nama Pemasok', placeholder: 'Masukkan Nama Pemasok' },
  { key: 'namaPic', label: 'Nama PIC', placeholder: 'Masukkan Nama PIC' },
  { key: 'telepon', label: 'Telepon', placeholder: 'Masukkan Nomor Telepon' },
  { key: 'email', label: 'Email', placeholder: 'Masukkan Email', type: 'email' },
  { key: 'alamat', label: 'Alamat', placeholder: 'Masukkan Alamat' },
]

function SupplierModal({ supplier, onClose, onSaved }: { supplier: Supplier | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>({
    nama: supplier?.nama ?? '',
    namaPic: supplier?.namaPic ?? '',
    telepon: supplier?.telepon ?? '',
    email: supplier?.email ?? '',
    alamat: supplier?.alamat ?? '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api(supplier ? `/suppliers/${supplier.id}` : '/suppliers', {
        method: supplier ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={supplier ? 'Edit Data Pemasok' : 'Tambahkan Pemasok Baru'} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        {fields.map((f) => (
          <FormRow key={f.key} label={f.label} htmlFor={f.key}>
            <input
              id={f.key}
              type={f.type}
              className={inputClass}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </FormRow>
        ))}
        {error && <ErrorNote message={error} />}
        <FormActions submitLabel={supplier ? 'Simpan' : 'Tambahkan'} submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  )
}

export function Pemasok() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ supplier: Supplier | null } | null>(null)
  const list = useFetch<Paged<Supplier>>(`/suppliers?page=${page}&pageSize=${PAGE_SIZE}`)

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Pemasok</h1>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Pemasok</h2>
          {isAdmin && (
            <button onClick={() => setModal({ supplier: null })} className="flex items-center gap-2 rounded-md border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-sky-50">
              <Plus size={18} /> Pemasok Baru
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
                      {['Nama Pemasok', 'Nama PIC', 'Telepon', 'Email', 'Alamat', ...(isAdmin ? ['Aksi'] : [])].map((h) => (
                        <th key={h} className="px-3 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.items.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="px-3 py-3">{s.nama}</td>
                        <td className="px-3 py-3">{s.namaPic}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{s.telepon}</td>
                        <td className="px-3 py-3">{s.email}</td>
                        <td className="px-3 py-3">{s.alamat}</td>
                        {isAdmin && (
                          <td className="px-3 py-3">
                            <button aria-label={`Edit ${s.nama}`} onClick={() => setModal({ supplier: s })} className="text-amber-500 hover:text-amber-600">
                              <Pencil size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {list.data.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-muted">
                          Belum ada pemasok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={list.data.page} pageSize={PAGE_SIZE} total={list.data.total} noun="pemasok" onChange={setPage} />
            </>
          )
        )}
      </Card>

      {modal && (
        <SupplierModal
          supplier={modal.supplier}
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
