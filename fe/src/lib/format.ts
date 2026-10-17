// "2026-10-17" -> "17/10/2026"
export function formatTanggal(ymd: string) {
  const [y, m, d] = ymd.split('-')
  return `${d}/${m}/${y}`
}

export function formatTanggalPanjang(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
