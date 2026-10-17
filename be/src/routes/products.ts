import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { KATEGORI, SATUAN } from "../constants.js";
import { requireRole } from "../middleware/auth.js";
import { stockStatus, stokPerProduk } from "../lib/stock.js";
import { today } from "../lib/date.js";

const router = Router();

const listQuery = z.object({
  kategori: z.string().optional(),
  status: z.enum(["AMAN", "PERINGATAN", "KRITIS", "MENIPIS"]).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const productBody = z.object({
  barcode: z.string().trim().min(1, "Barcode wajib diisi"),
  nama: z.string().trim().min(1, "Nama produk wajib diisi"),
  kategori: z.enum(KATEGORI, { message: "Pilih kategori produk" }),
  satuan: z.enum(SATUAN, { message: "Pilih satuan produk" }),
  minStok: z.coerce.number({ message: "Min stok wajib diisi" }).int("Min stok harus bilangan bulat").min(0, "Min stok tidak boleh negatif"),
});

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

router.get("/", async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { kategori, status, q, page, pageSize } = parsed.data;

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(kategori ? { kategori } : {}),
      ...(q ? { OR: [{ nama: { contains: q, mode: "insensitive" } }, { barcode: { contains: q } }] } : {}),
    },
    orderBy: { nama: "asc" },
  });
  const stok = await stokPerProduk(today());

  const rows = products
    .map((p) => {
      const s = stok.get(p.id) ?? 0;
      return {
        id: p.id,
        barcode: p.barcode,
        nama: p.nama,
        kategori: p.kategori,
        satuan: p.satuan,
        minStok: p.minStok,
        stok: s,
        status: stockStatus(s, p.minStok),
      };
    })
    .filter((p) => {
      if (!status) return true;
      if (status === "MENIPIS") return p.status !== "AMAN";
      return p.status === status;
    });

  res.json({
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    total: rows.length,
    page,
    pageSize,
  });
});

// Dipakai form Produk Masuk/Keluar untuk mengisi nama, kategori, dan satuan dari barcode.
router.get("/lookup", async (req, res) => {
  const barcode = String(req.query.barcode ?? "").trim();
  if (!barcode) return res.status(400).json({ message: "Barcode wajib diisi" });
  const p = await prisma.product.findFirst({ where: { barcode, deletedAt: null } });
  if (!p) return res.status(404).json({ message: "Barcode tidak ditemukan" });
  const stok = await stokPerProduk(today());
  res.json({ id: p.id, barcode: p.barcode, nama: p.nama, kategori: p.kategori, satuan: p.satuan, stok: stok.get(p.id) ?? 0 });
});

router.post("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = productBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  try {
    const p = await prisma.product.create({ data: parsed.data });
    res.status(201).json({ id: p.id });
  } catch (e) {
    if (isUniqueViolation(e)) return res.status(409).json({ message: "Barcode sudah terdaftar" });
    throw e;
  }
});

router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = productBody.safeParse(req.body);
  if (!Number.isInteger(id)) return res.status(400).json({ message: "ID tidak valid" });
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return res.status(404).json({ message: "Produk tidak ditemukan" });
  try {
    await prisma.product.update({ where: { id }, data: parsed.data });
    res.json({ id });
  } catch (e) {
    if (isUniqueViolation(e)) return res.status(409).json({ message: "Barcode sudah terdaftar" });
    throw e;
  }
});

export default router;
