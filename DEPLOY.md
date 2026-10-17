# Panduan Deploy Stokify (gratis)

Urutannya: GitHub, Neon (database), Render (backend), Vercel (frontend). Semua gratis dan bisa login dengan akun GitHub.

## 1. Push ke GitHub
1. Buat repo kosong di github.com, misalnya `monitoring-expired-date` (boleh private).
2. Di terminal, dari folder `monitoring-expired-date`:
   ```bash
   git init
   git add .
   git commit -m "Stokify"
   git branch -M main
   git remote add origin https://github.com/<username-kamu>/monitoring-expired-date.git
   git push -u origin main
   ```
3. Pastikan `be/.env` tidak ikut ter-push (sudah dikecualikan oleh `.gitignore`).

## 2. Database di Neon
1. Buka neon.tech, daftar, lalu **Create project** (nama bebas, region terdekat, misalnya Singapore).
2. Di dashboard, klik **Connect**, pilih **Pooled connection** dimatikan (pakai koneksi langsung), lalu salin connection string. Bentuknya:
   `postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. Simpan string ini, namanya kita sebut `NEON_URL`.

## 3. Buat tabel dan data awal (dari laptop, sekali saja)
```bash
cd be
npm install
DATABASE_URL="NEON_URL" npx prisma migrate deploy
DATABASE_URL="NEON_URL" npm run db:seed
```
Ganti `NEON_URL` dengan string dari langkah 2 (pakai tanda kutip). Akun contoh yang terbuat: `admin`, `gudang`, `area`, kata sandi `password123`.

## 4. Backend di Render
1. Buka render.com, daftar dengan GitHub.
2. **New > Blueprint**, pilih repo tadi. Render membaca `render.yaml` dan menyiapkan service `stokify-api`.
3. Saat diminta, isi `DATABASE_URL` dengan `NEON_URL`. `JWT_SECRET` dibuat otomatis.
4. Klik **Apply** dan tunggu build selesai (beberapa menit).
5. Salin URL service, misalnya `https://stokify-api.onrender.com`, lalu buka `https://stokify-api.onrender.com/api/health`. Harus muncul `{"ok":true}`.

## 5. Frontend di Vercel
1. Sebelum deploy, buka `fe/vercel.json` dan ganti `GANTI-NAMA-API.onrender.com` dengan host Render dari langkah 4 (misalnya `stokify-api.onrender.com`). Commit dan push:
   ```bash
   git add fe/vercel.json
   git commit -m "Set URL API"
   git push
   ```
2. Buka vercel.com, daftar dengan GitHub, klik **Add New > Project**, pilih repo.
3. Atur **Root Directory** ke `fe`. Framework terdeteksi Vite (build `npm run build`, output `dist`). Klik **Deploy**.
4. Buka URL Vercel yang diberikan (misalnya `https://stokify.vercel.app`) dan login dengan `admin` / `password123`.

## 6. Setelah live
- Ganti kata sandi akun contoh lewat menu **Pengaturan** (Edit pengguna, isi Kata Sandi Baru).
- Backend gratis Render tidur sekitar 15 menit tanpa trafik, jadi request pertama bisa lambat sekitar 30 detik. Buka halaman login sebelum presentasi supaya sudah hangat.

## Masalah umum
- **Login gagal / 502 di Vercel**: host di `vercel.json` salah atau backend masih tidur. Cek `/api/health` di Render.
- **Build Render gagal soal Prisma**: pastikan `DATABASE_URL` terisi dan `sslmode=require` ada di ujungnya.
- **Halaman kosong saat refresh di sub-halaman**: pastikan `vercel.json` ikut ter-push (aturan rewrite ke `index.html`).
