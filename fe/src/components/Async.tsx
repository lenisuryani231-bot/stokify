import type { ReactNode } from 'react'

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </p>
  )
}

export function Loading() {
  return <p className="py-6 text-sm text-muted">Memuat data...</p>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg bg-white p-5 ${className}`}>{children}</section>
}
