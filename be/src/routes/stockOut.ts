import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { KETERANGAN_KELUAR } from "../constants.js";
import { requireRole } from "../middleware/auth.js";
import { batchFilter, fefoOrder, HttpError, lockProductBatches, parseYmd, planFefo, type Tx } from "../lib/fefo.js";
import { today as todayDate, toYmd } from "../lib/date.js";

const router = Router();

const listQuery = z.object({
  kategori: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const body = z.object({
  tglKeluar: z.string({ message: "Tanggal keluar wajib diisi" }).transform((v, ctx) => {
    const d = parseYmd(v);
    if (!d) ctx.addIssue({ code: "custom", message: "Tanggal keluar wajib diisi" });
    return d ?? new Date(0);
  }),
  barcode: z.string().trim().min(1, "Barcode wajib diisi"),
  qty: z.coerce.number({ message: "Qty wajib diisi" }).int("Qty harus bilangan bulat").min(1, "Qty minimal 1"),
  keterangan: z.enum(KETERANGAN_KELUAR, { message: "Pilih keterangan" }),
});

const previewQuery = z.object({
  barcode: z.string().trim().min(1),
  qty: z.coerce.number().int().min(1),
  keterangan: z.string().default(""),
  ignore: z.coerce.number().int().optional(),
});

async function findProduct(tx: Tx | typeof prisma, barcode: string) {
  const product = await tx.product.findFirst({ where: { barcode, deletedAt: null } });
  if (!product) throw new HttpError(404, "Barcode tidak ditemukan");
  return product;
}

// Ambil stok dari batch paling dekat kadaluwarsa dan kurangi sisanya. Harus dipanggil di dalam transaksi.
async function allocate(tx: Tx, productId: number, satuan: string, qty: number, keterangan: string) {
  const batches = await tx.stockBatch.findMany({
    where: { productId, ...batchFilter(todayDate(), keterangan) },
    orderBy: [...fefoOrder],
  });
  const { plan, tersedia } = planFefo(batches, qty);
  if (tersedia < qty) throw new HttpError(400, `Stok tidak mencukupi. Tersedia ${tersedia} ${satuan}`);
  for (const a of plan) {
    await tx.stockBatch.update({ where: { id: a.batchId }, data: { qtySisa: { decrement: a.qty } } });
  }
  return plan;
}

router.get("/", async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { kategori, page, pageSize } = parsed.data;
  const where = { stockOut: { dibatalkan: false, product: { deletedAt: null, ...(kategori ? { kategori } : {}) } } };

  const [rows, total] = await Promise.all([
    prisma.stockOutItem.findMany({
      where,
      include: { stockOut: { include: { product: true } }, batch: true },
      orderBy: [{ stockOut: { tglKeluar: "desc" } }, { stockOutId: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockOutItem.count({ where }),
  ]);

  res.json({
    items: rows.map((i) => ({
      id: i.id,
      stockOutId: i.stockOutId,
      tglKeluar: toYmd(i.stockOut.tglKeluar),
      barcode: i.stockOut.product.barcode,
      nama: i.stockOut.product.nama,
      kategori: i.stockOut.product.kategori,
      qty: i.qty,
      qtyTotal: i.stockOut.qty,
      satuan: i.stockOut.product.satuan,
      tglKadaluwarsa: toYmd(i.batch.tglKadaluwarsa),
      keterangan: i.stockOut.keterangan,
    })),
    total,
    page,
    pageSize,
  });
});

// Pratinjau alokasi FEFO untuk form tanpa mengubah stok.
// `ignore` = id pengeluaran yang sedang diedit; stoknya dihitung seolah dikembalikan dulu.
router.get("/preview", async (req, res) => {
  const parsed = previewQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Barcode dan qty wajib diisi" });
  const { barcode, qty, keterangan, ignore } = parsed.data;
  const product = await findProduct(prisma, barcode);

  // Batch yang habis karena pengeluaran ini juga harus ikut dihitung, jadi qtySisa difilter setelah stok dikembalikan.
  const { qtySisa: _abaikan, ...filterTanggal } = batchFilter(todayDate(), keterangan);
  const batches = await prisma.stockBatch.findMany({
    where: { productId: product.id, ...filterTanggal },
    orderBy: [...fefoOrder],
  });
  if (ignore) {
    const dipakai = await prisma.stockOutItem.findMany({ where: { stockOutId: ignore, stockOut: { productId: product.id } } });
    for (const item of dipakai) {
      const b = batches.find((x) => x.id === item.batchId);
      if (b) b.qtySisa += item.qty;
    }
  }
  batches.splice(0, batches.length, ...batches.filter((b) => b.qtySisa > 0));
  const { plan, tersedia } = planFefo(batches, qty);
  if (tersedia < qty) return res.status(400).json({ message: `Stok tidak mencukupi. Tersedia ${tersedia} ${product.satuan}` });
  res.json({ tersedia, alokasi: plan.map((a) => ({ tglKadaluwarsa: toYmd(a.tglKadaluwarsa), qty: a.qty })) });
});

router.post("/", requireRole("STAF_AREA"), async (req, res) => {
  const parsed = body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { tglKeluar, barcode, qty, keterangan } = parsed.data;
  const product = await findProduct(prisma, barcode);

  const id = await prisma.$transaction(async (tx) => {
    await lockProductBatches(tx, [product.id]);
    const plan = await allocate(tx, product.id, product.satuan, qty, keterangan);
    const out = await tx.stockOut.create({
      data: {
        productId: product.id,
        tglKeluar,
        qty,
        keterangan,
        items: { create: plan.map((a) => ({ batchId: a.batchId, qty: a.qty })) },
      },
    });
    return out.id;
  });
  res.status(201).json({ id });
});

// Edit = kembalikan stok lama, lalu alokasikan ulang dengan data baru, semuanya satu transaksi.
router.put("/:id", requireRole("STAF_AREA"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: "ID tidak valid" });
  const parsed = body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { tglKeluar, barcode, qty, keterangan } = parsed.data;
  const product = await findProduct(prisma, barcode);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.stockOut.findUnique({ where: { id }, include: { items: true } });
    if (!existing || existing.dibatalkan) throw new HttpError(404, "Data produk keluar tidak ditemukan");

    await lockProductBatches(tx, [existing.productId, product.id]);
    for (const item of existing.items) {
      await tx.stockBatch.update({ where: { id: item.batchId }, data: { qtySisa: { increment: item.qty } } });
    }
    await tx.stockOutItem.deleteMany({ where: { stockOutId: id } });

    const plan = await allocate(tx, product.id, product.satuan, qty, keterangan);
    await tx.stockOut.update({
      where: { id },
      data: {
        productId: product.id,
        tglKeluar,
        qty,
        keterangan,
        items: { create: plan.map((a) => ({ batchId: a.batchId, qty: a.qty })) },
      },
    });
  });
  res.json({ id });
});

export default router;
