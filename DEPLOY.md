# Panduan Deploy Stokify (gratis)

Urutannya: GitHub, Neon (database), Vercel proyek backend, Vercel proyek frontend. Semua tanpa kartu. Semua gratis dan bisa login dengan akun GitHub.

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

## 4. Backend di Vercel (gratis, tanpa kartu)
Backend dijalankan sebagai serverless function di Vercel (paket Hobby), jadi tidak perlu hosting terpisah dan tidak ada kartu. Folder `be` sudah siap: `be/vercel.json`, `be/api/index.js` (hasil bundel aplikasi), dan `be/public`.

1. Di terminal, bundel ulang dulu supaya `be/api/index.js` terbaru, lalu commit dan push:
   ```bash
   cd be
   npm install
   npm run build:vercel
   cd ..
   git add .
   git commit -m "Build backend untuk Vercel"
   git push
   ```
2. Buka vercel.com > **Add New > Project**, pilih repo yang sama.
3. Isian:
   - Project Name: misalnya `stokify-api`
   - Root Directory: `be`
   - Framework Preset: **Other**
   - Build dan Output Directory dibiarkan (sudah diatur di `be/vercel.json`).
4. Buka **Environment Variables** (nilai ini rahasia dan aman di sini), tambahkan:
   - `DATABASE_URL` = string Neon versi **Pooled connection** (host berakhiran `-pooler`), lalu tambahkan di ujungnya `&pgbouncer=true&connection_limit=1`. Contoh: `postgresql://user:pw@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1`
   - `JWT_SECRET` = teks acak minimal 32 karakter (`openssl rand -base64 48`)
   - `NODE_ENV` = `production`
5. Klik **Deploy**. Setelah selesai, buka `https://<nama-proyek>.vercel.app/api/health`, harus muncul `{"ok":true}`.

Catatan: langkah 3 (migrate dan seed) tetap memakai string Neon **langsung** (bukan pooled), dijalankan dari laptop.

## 5. Frontend di Vercel
1. Sebelum deploy, buka `fe/vercel.json` dan ganti `GANTI-NAMA-PROYEK-API.vercel.app` dengan host proyek backend dari langkah 4 (misalnya `stokify-api.vercel.app`). Commit dan push:
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
- Function serverless menyala saat ada request, jadi request pertama setelah sepi bisa agak lambat (beberapa detik). Setiap kali kode `be` berubah, jalankan `npm run build:vercel` lalu commit `be/api/index.js` sebelum push.

## Masalah umum
- **Login gagal / 502 di Vercel**: host di `vercel.json` salah atau backend belum berhasil deploy. Cek `/api/health` di URL proyek backend.
- **/api/health error 500**: lihat Vercel > proyek backend > Logs. Biasanya `DATABASE_URL` atau `JWT_SECRET` belum diisi, atau `sslmode=require` tidak ada di string Neon.
- **Halaman kosong saat refresh di sub-halaman**: pastikan `vercel.json` ikut ter-push (aturan rewrite ke `index.html`).
