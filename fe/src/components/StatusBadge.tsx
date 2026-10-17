import type { StockStatus } from '../lib/types'

const style: Record<StockStatus, { label: string; cls: string }> = {
  AMAN: { label: 'Aman', cls: 'bg-green-100 text-green-700' },
  PERINGATAN: { label: 'Peringatan', cls: 'bg-amber-100 text-amber-600' },
  KRITIS: { label: 'Kritis', cls: 'bg-red-100 text-red-600' },
}

export function StatusBadge({ status }: { status: StockStatus }) {
  const { label, cls } = style[status]
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${cls}`}>{label}</span>
}

export const statusLabel = (s: StockStatus) => style[s].label
