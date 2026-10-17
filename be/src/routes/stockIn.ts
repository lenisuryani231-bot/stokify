import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/auth.js";
import { HttpError, parseYmd } from "../lib/fefo.js";
import { toYmd } from "../lib/date.js";

const router = Router();

const listQuery = z.object({
  kategori: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const ymd = (label: string) =>
  z
    .string({ message: `${label} wajib diisi` })
    .transform((v, ctx) => {
      const d = parseYmd(v);
      if (!d) ctx.addIssue({ code: "custom", message: `${label} wajib diisi` });
      return d ?? new Date(0);
    });

const body = z.object({
  tglTerima: ymd("Tanggal terima"),
  barcode: z.string().trim().min(1, "Barcode wajib diisi"),
  qty: z.coerce.number({ message: "Qty wajib diisi" }).int("Qty harus bilangan bulat").min(1, "Qty minimal 1"),
  tglKadaluwarsa: ymd("Tanggal kadaluwarsa"),
  supplierId: z.coerce.number().int().positive().nullable().optional(),
});

type Body = z.infer<typeof body>;

async function resolveRefs(input: Body) {
  if (input.tglKadaluwarsa < input.tglTerima) {
    throw new HttpError(400, "Tanggal kadaluwarsa tidak boleh sebelum tanggal terima");
  }
  const product = await prisma.product.findFirst({ where: { barcode: input.barcode, deletedAt: null } });
  if (!product) throw new HttpError(404, "Barcode tidak ditemukan");
  if (input.supplierId) {
    const s = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
    if (!s) throw new HttpError(400, "Pemasok tidak ditemukan");
  }
  return product;
}

router.get("/", async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { kategori, page, pageSize } = parsed.data;
  const where = { product: { deletedAt: null, ...(kategori ? { kategori } : {}) } };

  const [rows, total] = await Promise.all([
    prisma.stockBatch.findMany({
      where,
      include: { product: true, supplier: true },
      orderBy: [{ tglTerima: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockBatch.count({ where }),
  ]);

  res.json({
    items: rows.map((b) => ({
      id: b.id,
      tglTerima: toYmd(b.tglTerima),
      barcode: b.product.barcode,
      nama: b.product.nama,
      kategori: b.product.kategori,
      qty: b.qtyMasuk,
      satuan: b.product.satuan,
      tglKadaluwarsa: toYmd(b.tglKadaluwarsa),
      supplierId: b.supplierId,
      pemasok: b.supplier?.nama ?? null,
      // Batch yang sudah dipakai produk keluar tidak boleh diubah agar stok tetap konsisten.
      bisaDiedit: b.qtySisa === b.qtyMasuk,
    })),
    total,
    page,
    pageSize,
  });
});

router.post("/", requireRole("STAF_GUDANG"), async (req, res) => {
  const parsed = body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const input = parsed.data;
  const product = await resolveRefs(input);
  const batch = await prisma.stockBatch.create({
    data: {
      productId: product.id,
      supplierId: input.supplierId ?? null,
      tglTerima: input.tglTerima,
      tglKadaluwarsa: input.tglKadaluwarsa,
      qtyMasuk: input.qty,
      qtySisa: input.qty,
    },
  });
  res.status(201).json({ id: batch.id });
});

router.put("/:id", requireRole("STAF_GUDANG"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: "ID tidak valid" });
  const parsed = body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const input = parsed.data;
  const product = await resolveRefs(input);

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "StockBatch" WHERE id = ${id} FOR UPDATE`;
    const batch = await tx.stockBatch.findUnique({ where: { id } });
    if (!batch) throw new HttpError(404, "Data produk masuk tidak ditemukan");
    if (batch.qtySisa !== batch.qtyMasuk) {
      throw new HttpError(409, "Batch ini sudah dipakai produk keluar, sehingga tidak bisa diubah");
    }
    await tx.stockBatch.update({
      where: { id },
      data: {
        productId: product.id,
        supplierId: input.supplierId ?? null,
        tglTerima: input.tglTerima,
        tglKadaluwarsa: input.tglKadaluwarsa,
        qtyMasuk: input.qty,
        qtySisa: input.qty,
      },
    });
  });
  res.json({ id });
});

export default router;
