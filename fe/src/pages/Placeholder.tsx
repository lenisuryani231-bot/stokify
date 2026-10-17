export function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">Halaman ini akan dibuat di tahap berikutnya.</p>
    </div>
  )
}
