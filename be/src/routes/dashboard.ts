import { Router } from "express";
import { prisma } from "../db.js";
import { AMBANG_HARI_KADALUWARSA } from "../constants.js";
import { addDays, daysBetween, toYmd, today as todayDate } from "../lib/date.js";
import { stockStatus, stokPerProduk } from "../lib/stock.js";

const router = Router();

const LIST_LIMIT = 4;
const ATTENTION_LIMIT = 7;

router.get("/", async (_req, res) => {
  const today = todayDate();
  const batas = addDays(today, AMBANG_HARI_KADALUWARSA);
  const batchPerhatian = {
    qtySisa: { gt: 0 },
    tglKadaluwarsa: { lte: batas },
    product: { deletedAt: null },
  };

  const [products, stok, masuk, keluar, jumlahPerhatian, batchPerhatianRows] = await Promise.all([
    prisma.product.findMany({ where: { deletedAt: null }, orderBy: { nama: "asc" } }),
    stokPerProduk(today),
    prisma.stockBatch.aggregate({ where: { tglTerima: today }, _sum: { qtyMasuk: true } }),
    prisma.stockOut.aggregate({ where: { tglKeluar: today, dibatalkan: false }, _sum: { qty: true } }),
    prisma.stockBatch.count({ where: batchPerhatian }),
    prisma.stockBatch.findMany({
      where: batchPerhatian,
      include: { product: true },
      orderBy: [{ tglKadaluwarsa: "asc" }, { id: "asc" }],
      take: ATTENTION_LIMIT,
    }),
  ]);

  const withStatus = products.map((p) => {
    const s = stok.get(p.id) ?? 0;
    return { id: p.id, nama: p.nama, satuan: p.satuan, minStok: p.minStok, stok: s, status: stockStatus(s, p.minStok) };
  });
  const byRatio = (a: (typeof withStatus)[number], b: (typeof withStatus)[number]) =>
    a.stok / Math.max(a.minStok, 1) - b.stok / Math.max(b.minStok, 1);
  const menipis = withStatus.filter((p) => p.status !== "AMAN").sort(byRatio);
  const aman = withStatus.filter((p) => p.status === "AMAN").sort(byRatio);

  const perKategori = new Map<string, number>();
  for (const p of products) perKategori.set(p.kategori, (perKategori.get(p.kategori) ?? 0) + 1);

  res.json({
    tanggal: toYmd(today),
    ringkasan: {
      totalProduk: products.length,
      jumlahKategori: perKategori.size,
      masukHariIni: masuk._sum.qtyMasuk ?? 0,
      keluarHariIni: keluar._sum.qty ?? 0,
      mendekatiKadaluwarsa: jumlahPerhatian,
    },
    kategori: [...perKategori.entries()].map(([nama, jumlah]) => ({
      nama,
      jumlah,
      persen: products.length ? Math.round((jumlah / products.length) * 1000) / 10 : 0,
    })),
    stokMenipis: { total: menipis.length, items: menipis.slice(0, LIST_LIMIT) },
    stokAman: { total: aman.length, items: aman.slice(0, LIST_LIMIT) },
    perhatian: {
      total: jumlahPerhatian,
      items: batchPerhatianRows.map((b) => ({
        id: b.id,
        barcode: b.product.barcode,
        nama: b.product.nama,
        kategori: b.product.kategori,
        stok: b.qtySisa,
        satuan: b.product.satuan,
        tglKadaluwarsa: toYmd(b.tglKadaluwarsa),
        sisaHari: daysBetween(today, b.tglKadaluwarsa),
      })),
    },
  });
});

export default router;
