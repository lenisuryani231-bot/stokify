// Daftar pilihan yang dipakai form dan filter; frontend mengambilnya lewat GET /api/meta.
export const KATEGORI = [
  "Sayur & Buah",
  "Dairy & Chilled",
  "Daging",
  "Seafood",
  "Bakery",
  "Ready to Eat / Ready to Cook",
] as const;

export const SATUAN = ["Pack", "Kotak", "Pcs", "Kg", "Botol"] as const;

// Sisa hari kadaluwarsa paling lama yang masuk "Produk yang Harus Diperhatikan".
export const AMBANG_HARI_KADALUWARSA = 3;

// Pilihan keterangan produk keluar. Hanya "Kadaluwarsa (dimusnahkan)" yang boleh mengambil batch kadaluwarsa.
export const KETERANGAN_KADALUWARSA = "Kadaluwarsa (dimusnahkan)";
export const KETERANGAN_KELUAR = [
  "Ditata ke rak display",
  "Isi ulang rak (restock)",
  "Mendekati kadaluwarsa",
  "Produk sudah keluar dari gudang",
  "Rusak / cacat",
  "Retur ke pemasok",
  "Salah input",
  "Selisih stok (opname)",
  "Hilang",
  KETERANGAN_KADALUWARSA,
  "Lainnya",
] as const;

export const PERAN = [
  { value: "ADMIN", label: "Admin" },
  { value: "STAF_GUDANG", label: "Staf Gudang" },
  { value: "STAF_AREA", label: "Staf Area" },
] as const;

// Ringkasan hak akses yang ditampilkan di Pengaturan. Aturan sebenarnya dijalankan oleh
// requireRole di masing-masing route, jadi ubah keduanya bersamaan.
export const HAK_AKSES = [
  { menu: "Dasbor", ADMIN: "Lihat", STAF_GUDANG: "Lihat", STAF_AREA: "Lihat" },
  { menu: "Data Produk", ADMIN: "Kelola", STAF_GUDANG: "Lihat", STAF_AREA: "Lihat" },
  { menu: "Pemasok", ADMIN: "Kelola", STAF_GUDANG: "Lihat", STAF_AREA: "Lihat" },
  { menu: "Produk Masuk", ADMIN: "Lihat", STAF_GUDANG: "Kelola", STAF_AREA: "Lihat" },
  { menu: "Produk Keluar", ADMIN: "Lihat", STAF_GUDANG: "Lihat", STAF_AREA: "Kelola" },
  { menu: "Pengaturan", ADMIN: "Kelola", STAF_GUDANG: "Lihat", STAF_AREA: "Lihat" },
] as const;
