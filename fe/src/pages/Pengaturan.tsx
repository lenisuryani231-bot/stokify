import { useState, type FormEvent } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useFetch } from '../lib/useFetch'
import type { AppUser, Meta } from '../lib/types'
import { Card, ErrorNote, Loading } from '../components/Async'
import { FormActions, FormRow, Modal, inputClass } from '../components/Modal'

interface FormState {
  nama: string
  username: string
  role: string
  password: string
  isActive: boolean
}

function UserModal({ target, meta, onClose, onSaved }: { target: AppUser | null; meta: Meta; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>({
    nama: target?.nama ?? '',
    username: target?.username ?? '',
    role: target?.role ?? '',
    password: '',
    isActive: target?.isActive ?? true,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const set = (k: 'nama' | 'username' | 'role' | 'password') => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api(target ? `/users/${target.id}` : '/users', {
        method: target ? 'PUT' : 'POST',
        body: JSON.stringify(target ? form : { nama: form.nama, username: form.username, role: form.role, password: form.password }),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={target ? 'Edit Data Pengguna' : 'Pengguna Baru'} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormRow label="Nama" htmlFor="nama">
          <input id="nama" className={inputClass} placeholder="Masukkan Nama" value={form.nama} onChange={set('nama')} />
        </FormRow>
        <FormRow label="Nama Pengguna" htmlFor="username">
          <input id="username" className={inputClass} placeholder="Masukkan Nama Pengguna" value={form.username} onChange={set('username')} autoComplete="off" />
        </FormRow>
        <FormRow label="Peran" htmlFor="role">
          <select id="role" className={inputClass} value={form.role} onChange={set('role')}>
            <option value="">Pilih Peran</option>
            {meta.peran.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label={target ? 'Kata Sandi Baru' : 'Kata Sandi'} htmlFor="password">
          <input
            id="password"
            type="password"
            className={inputClass}
            placeholder={target ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
        </FormRow>
        {target && (
          <FormRow label="Status" htmlFor="isActive">
            <select id="isActive" className={inputClass} value={form.isActive ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === '1' }))}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </FormRow>
        )}
        {error && <ErrorNote message={error} />}
        <FormActions submitLabel={target ? 'Simpan' : 'Tambahkan'} submitting={submitting} onCancel={onClose} />
      </form>
    </Modal>
  )
}

export function Pengaturan() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [modal, setModal] = useState<{ target: AppUser | null } | null>(null)
  const meta = useFetch<Meta>('/meta')
  const users = useFetch<{ items: AppUser[] }>('/users')

  const roleLabel = (v: string) => meta.data?.peran.find((p) => p.value === v)?.label ?? v

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Pengaturan</h1>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">Pengguna</h2>
          {isAdmin && meta.data && (
            <button onClick={() => setModal({ target: null })} className="flex items-center gap-2 rounded-md border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-sky-50">
              <Plus size={18} /> Pengguna Baru
            </button>
          )}
        </div>
        {users.error && <ErrorNote message={users.error} />}
        {users.loading && !users.data ? (
          <Loading />
        ) : (
          users.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {['Nama', 'Nama Pengguna', 'Peran', 'Status', ...(isAdmin ? ['Aksi'] : [])].map((h) => (
                      <th key={h} className="px-3 py-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.data.items.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="px-3 py-3">{u.nama}</td>
                      <td className="px-3 py-3 text-muted">{u.username}</td>
                      <td className="px-3 py-3">{roleLabel(u.role)}</td>
                      <td className="px-3 py-3">
                        <span className={u.isActive ? 'text-green-600' : 'text-muted'}>{u.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <button aria-label={`Edit ${u.nama}`} onClick={() => setModal({ target: u })} className="text-amber-500 hover:text-amber-600">
                            <Pencil size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-medium">Hak Akses per Peran</h2>
        {meta.error && <ErrorNote message={meta.error} />}
        {meta.loading && !meta.data ? (
          <Loading />
        ) : (
          meta.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 font-medium">Menu</th>
                    {meta.data.peran.map((p) => (
                      <th key={p.value} className="px-3 py-3 font-medium">
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meta.data.hakAkses.map((h) => (
                    <tr key={h.menu} className="border-b border-gray-100">
                      <td className="px-3 py-3">{h.menu}</td>
                      {meta.data!.peran.map((p) => {
                        const v = h[p.value as 'ADMIN' | 'STAF_GUDANG' | 'STAF_AREA']
                        return (
                          <td key={p.value} className="px-3 py-3">
                            <span className={v === 'Kelola' ? 'font-medium text-brand-dark' : 'text-muted'}>{v}</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      {modal && meta.data && (
        <UserModal
          target={modal.target}
          meta={meta.data}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            users.reload()
          }}
        />
      )}
    </div>
  )
}
