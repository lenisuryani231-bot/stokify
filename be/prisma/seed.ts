import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

// Tanggal relatif terhadap hari ini (Asia/Jakarta) agar dasbor selalu berisi data yang relevan.
const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
const today = new Date(`${ymd}T00:00:00Z`);
const hariKe = (n: number) => new Date(today.getTime() + n * DAY_MS);

const users: { nama: string; username: string; role: Role }[] = [
  { nama: "Rina Kartika", username: "admin", role: "ADMIN" },
  { nama: "Dedi Saputra", username: "gudang", role: "STAF_GUDANG" },
  { nama: "Adinda Putri", username: "area", role: "STAF_AREA" },
];

const suppliers = [
  ["PT Sayur Buah Segar Nusantara", "Andi Wijaya", "0852-5608-8849"],
  ["CV Tani Makmur Sejahtera", "Siti Rahma", "0857-4007-9275"],
  ["PT Dairy Fresh Indonesia", "Budi Santoso", "0811-1231-7079"],
  ["CV Chilled Food Prima", "Lina Marlina", "0812-3374-4805"],
  ["PT Berdikari Daging Prima", "Rudi Hartono", "0811-8157-7664"],
  ["CV Ayam Segar Sentosa", "Hendra Gunawan", "0811-6389-9849"],
  ["PT Seafood Nusantara Jaya", "Agus Setiawan", "0812-3045-1320"],
  ["CV Laut Biru Segar", "Dewi Puspita", "0857-6618-7575"],
  ["PT Bakery Sejahtera Bersama", "Yusuf Ramadhan", "0813-1608-8699"],
  ["CV Roti Nikmat Abadi", "Joko Prasetyo", "0821-4417-2162"],
  ["PT Siap Saji Boga", "Maya Anggraini", "0856-7357-4294"],
].map(([nama, namaPic, telepon], i) => ({
  nama,
  namaPic,
  telepon,
  email: `sales${i + 1}@${nama.toLowerCase().replace(/[^a-z]+/g, "")}.co.id`,
  alamat: "Jl. Sudirman No. 109, Bandung",
}));

// [nama, kategori, satuan, minStok, [[qtySisa, hariKeKadaluwarsa], ...]]
type Batch = [number, number];
const products: [string, string, string, number, Batch[]][] = [
  ["Brokoli Organik Fresh", "Sayur & Buah", "Pack", 5, [[2, 1], [3, 6]]],
  ["Apel Fuji Premium", "Sayur & Buah", "Pack", 5, [[8, 12]]],
  ["Wortel Lokal 500gr", "Sayur & Buah", "Pack", 6, [[9, 5]]],
  ["Bayam Hijau Ikat", "Sayur & Buah", "Pack", 8, [[3, 2]]],
  ["Pisang Cavendish", "Sayur & Buah", "Pack", 6, [[14, 4]]],
  ["Susu UHT Ultra 1L", "Dairy & Chilled", "Pack", 3, [[1, 1], [3, 20]]],
  ["Yogurt Plain 500ml", "Dairy & Chilled", "Botol", 6, [[10, 9]]],
  ["Keju Cheddar Slice", "Dairy & Chilled", "Pack", 4, [[5, 30]]],
  ["Telur Ayam Negeri 10pcs", "Dairy & Chilled", "Pack", 8, [[4, 14]]],
  ["Dada Ayam Fillet 500gr", "Daging", "Pack", 10, [[1, 1], [11, 6]]],
  ["Daging Sapi Giling 250gr", "Daging", "Pack", 8, [[6, 3]]],
  ["Sosis Sapi Premium", "Daging", "Pack", 5, [[12, 25]]],
  ["Udang Kupas Beku 250gr", "Seafood", "Pack", 4, [[2, 2], [3, 40]]],
  ["Fillet Salmon 200gr", "Seafood", "Pack", 4, [[7, 8]]],
  ["Cumi Segar 300gr", "Seafood", "Pack", 4, [[1, -1], [2, 5]]],
  ["Roti Tawar Gandum", "Bakery", "Pack", 5, [[3, 3]]],
  ["Croissant Butter Pack", "Bakery", "Pack", 5, [[2, 2], [4, 3], [5, 3]]],
  ["Donat Gula Halus", "Bakery", "Pack", 6, [[15, 4]]],
  ["Roti Sobek Coklat", "Bakery", "Pack", 6, [[7, 6]]],
  ["Bento Set Ready to Cook", "Ready to Eat / Ready to Cook", "Kotak", 6, [[2, 2]]],
  ["Nasi Ayam Teriyaki", "Ready to Eat / Ready to Cook", "Kotak", 6, [[9, 3]]],
  ["Salad Buah Cup", "Ready to Eat / Ready to Cook", "Pcs", 8, [[5, 2]]],
  ["Mie Instan Seafood Segar", "Ready to Eat / Ready to Cook", "Pack", 5, [[12, 45]]],
  ["Dimsum Ayam 12pcs", "Ready to Eat / Ready to Cook", "Pack", 5, [[6, 60]]],
];

async function main() {
  const password = await bcrypt.hash("password123", 10);
  for (const u of users) {
    await prisma.user.upsert({ where: { username: u.username }, update: {}, create: { ...u, password } });
  }

  if ((await prisma.supplier.count()) === 0) {
    await prisma.supplier.createMany({ data: suppliers });
  }

  if ((await prisma.product.count()) === 0) {
    const supplierIds = (await prisma.supplier.findMany({ select: { id: true } })).map((s) => s.id);
    for (const [i, [nama, kategori, satuan, minStok, batches]] of products.entries()) {
      const product = await prisma.product.create({
        data: { barcode: String(8996001234000 + i + 1), nama, kategori, satuan, minStok },
      });
      for (const [j, [qtySisa, hari]] of batches.entries()) {
        // Beberapa batch dibuat "terima hari ini" supaya kartu Produk Masuk Hari Ini terisi.
        const diterimaHariIni = (i + j) % 4 === 0;
        await prisma.stockBatch.create({
          data: {
            productId: product.id,
            supplierId: supplierIds[(i + j) % supplierIds.length],
            tglTerima: diterimaHariIni ? today : hariKe(-3 - j),
            tglKadaluwarsa: hariKe(hari),
            qtyMasuk: qtySisa + 4,
            qtySisa,
          },
        });
      }
    }

    // Beberapa pengeluaran hari ini yang memakai batch pertama sebagai contoh alokasi FEFO.
    const batches = await prisma.stockBatch.findMany({ where: { qtySisa: { gt: 5 } }, take: 3, orderBy: { id: "asc" } });
    const keterangan = ["Ditata ke rak display", "Isi ulang rak (restock)", "Mendekati kadaluwarsa"];
    for (const [k, b] of batches.entries()) {
      const qty = 2 + k;
      await prisma.stockOut.create({
        data: {
          productId: b.productId,
          tglKeluar: today,
          qty,
          keterangan: keterangan[k],
          items: { create: { batchId: b.id, qty } },
        },
      });
      await prisma.stockBatch.update({ where: { id: b.id }, data: { qtySisa: { decrement: qty } } });
    }
  }

  console.log("Seed selesai. Akun contoh: admin / gudang / area, kata sandi: password123");
}

main().finally(() => prisma.$disconnect());
