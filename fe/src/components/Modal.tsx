import { useEffect, type ReactNode } from 'react'

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[500px] rounded-lg bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-medium">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function FormRow({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="mb-4 grid grid-cols-[150px_1fr] items-center gap-3">
      <label htmlFor={htmlFor} className="text-[15px]">
        {label}
      </label>
      {children}
    </div>
  )
}

export const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:bg-gray-50 disabled:text-muted'

export function FormActions({ submitLabel, submitting, onCancel }: { submitLabel: string; submitting: boolean; onCancel: () => void }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="rounded-md border border-gray-200 px-5 py-2.5 text-sm text-muted hover:bg-gray-50">
        Batal
      </button>
      <button type="submit" disabled={submitting} className="rounded-md bg-brand-dark px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
        {submitting ? 'Menyimpan...' : submitLabel}
      </button>
    </div>
  )
}

// Scanner barcode USB mengetik angka lalu menekan Enter; Enter di sini pindah fokus, bukan kirim form.
export function focusNextOnEnter(nextId: string) {
  return (e: { key: string; preventDefault: () => void }) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    document.getElementById(nextId)?.focus()
  }
}

export function todayLocal() {
  return new Date().toLocaleDateString('en-CA')
}
