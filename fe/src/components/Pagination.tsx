function pageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

const btn = 'rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

export function Pagination({
  page,
  pageSize,
  total,
  noun,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  noun: string
  onChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>
        Menampilkan {from}-{to} dari {total} {noun}
      </span>
      <div className="flex items-center gap-1.5">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Sebelumnya
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`rounded px-3 py-1.5 text-sm ${p === page ? 'bg-sky-100 font-medium text-brand-dark' : 'hover:bg-gray-100'}`}
            >
              {p}
            </button>
          ),
        )}
        <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Selanjutnya
        </button>
      </div>
    </div>
  )
}
