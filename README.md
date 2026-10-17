# Stokify: Monitoring Expired Date

- `fe/`: React + TypeScript (Vite, Tailwind)
- `be/`: Express + TypeScript + Prisma + PostgreSQL

## Menjalankan di lokal

```bash
# 1. Backend
cd be
cp .env.example .env        # sesuaikan DATABASE_URL dan JWT_SECRET
npm install
npx prisma migrate dev      # membuat tabel
npm run db:seed             # akun contoh (admin / gudang / area, sandi: password123)
                            # plus produk, batch, dan pemasok contoh; aman dijalankan ulang
npm run dev                 # http://localhost:4000

# 2. Frontend (terminal lain)
cd fe
npm install
npm run dev                 # http://localhost:5173 (proxy /api ke :4000)
```

## Menjalankan dan menghentikan sekaligus

Setelah `.env` di `be` terisi dan database siap (migrate + seed):

```bash
bash start.sh   # jalankan be dan fe di background, http://localhost:5173
bash stop.sh    # hentikan keduanya
```

Log ada di `.run/be.log` dan `.run/fe.log`. `start.sh` otomatis menghentikan instance lama dan menjalankan `npm install` jika `node_modules` belum ada.

## Status

- [x] Login, logout, sesi (cookie httpOnly), proteksi route
- [x] Layout (sidebar, header)
- [x] Dasbor, Data Produk, Pemasok (semua data dari API; tambah/edit khusus Admin)
- [x] Pengaturan Pengguna
- [x] Produk Masuk (Staf Gudang) dan Produk Keluar (Staf Area) dengan alokasi FEFO otomatis per batch; Admin hanya melihat
