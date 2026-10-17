export type StockStatus = 'KRITIS' | 'PERINGATAN' | 'AMAN'

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface Meta {
  kategori: string[]
  satuan: string[]
  keteranganKeluar: string[]
  peran: { value: string; label: string }[]
  hakAkses: { menu: string; ADMIN: string; STAF_GUDANG: string; STAF_AREA: string }[]
}

export interface AppUser {
  id: number
  nama: string
  username: string
  role: string
  isActive: boolean
}

export interface ProductLookup {
  id: number
  barcode: string
  nama: string
  kategori: string
  satuan: string
  stok: number
}

export interface StockIn {
  id: number
  tglTerima: string
  barcode: string
  nama: string
  kategori: string
  qty: number
  satuan: string
  tglKadaluwarsa: string
  supplierId: number | null
  pemasok: string | null
  bisaDiedit: boolean
}

export interface StockOut {
  id: number
  stockOutId: number
  tglKeluar: string
  barcode: string
  nama: string
  kategori: string
  qty: number
  qtyTotal: number
  satuan: string
  tglKadaluwarsa: string
  keterangan: string
}

export interface FefoPreview {
  tersedia: number
  alokasi: { tglKadaluwarsa: string; qty: number }[]
}

export interface Product {
  id: number
  barcode: string
  nama: string
  kategori: string
  satuan: string
  minStok: number
  stok: number
  status: StockStatus
}

export interface Supplier {
  id: number
  nama: string
  namaPic: string
  telepon: string
  email: string
  alamat: string
}

export interface StockSummary {
  id: number
  nama: string
  satuan: string
  minStok: number
  stok: number
  status: StockStatus
}

export interface Dashboard {
  tanggal: string
  ringkasan: {
    totalProduk: number
    jumlahKategori: number
    masukHariIni: number
    keluarHariIni: number
    mendekatiKadaluwarsa: number
  }
  kategori: { nama: string; jumlah: number; persen: number }[]
  stokMenipis: { total: number; items: StockSummary[] }
  stokAman: { total: number; items: StockSummary[] }
  perhatian: {
    total: number
    items: {
      id: number
      barcode: string
      nama: string
      kategori: string
      stok: number
      satuan: string
      tglKadaluwarsa: string
      sisaHari: number
    }[]
  }
}
