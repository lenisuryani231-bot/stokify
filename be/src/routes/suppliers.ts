import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const supplierBody = z.object({
  nama: z.string().trim().min(1, "Nama pemasok wajib diisi"),
  namaPic: z.string().trim().min(1, "Nama PIC wajib diisi"),
  telepon: z.string().trim().min(1, "Nomor telepon wajib diisi"),
  email: z.string().trim().email("Format email tidak valid"),
  alamat: z.string().trim().min(1, "Alamat wajib diisi"),
});

router.get("/", async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { page, pageSize } = parsed.data;
  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { id: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, nama: true, namaPic: true, telepon: true, email: true, alamat: true },
    }),
    prisma.supplier.count(),
  ]);
  res.json({ items, total, page, pageSize });
});

router.post("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = supplierBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const s = await prisma.supplier.create({ data: parsed.data });
  res.status(201).json({ id: s.id });
});

router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = supplierBody.safeParse(req.body);
  if (!Number.isInteger(id)) return res.status(400).json({ message: "ID tidak valid" });
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Pemasok tidak ditemukan" });
  await prisma.supplier.update({ where: { id }, data: parsed.data });
  res.json({ id });
});

export default router;
