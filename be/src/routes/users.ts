import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/auth.js";
import { HttpError } from "../lib/fefo.js";

const router = Router();

const ROLES = ["ADMIN", "STAF_GUDANG", "STAF_AREA"] as const;

const common = {
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Nama pengguna minimal 3 karakter")
    .regex(/^[a-z0-9._-]+$/, "Nama pengguna hanya boleh huruf, angka, titik, garis bawah, dan strip"),
  role: z.enum(ROLES, { message: "Pilih peran" }),
};

const createBody = z.object({
  ...common,
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

const updateBody = z.object({
  ...common,
  isActive: z.boolean(),
  // Kosong = kata sandi tidak diganti.
  password: z.union([z.literal(""), z.string().min(8, "Kata sandi minimal 8 karakter")]).optional(),
});

const publicFields = { id: true, nama: true, username: true, role: true, isActive: true } as const;

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

router.get("/", async (_req, res) => {
  const items = await prisma.user.findMany({ orderBy: { id: "asc" }, select: publicFields });
  res.json({ items });
});

router.post("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { password, ...data } = parsed.data;
  try {
    const user = await prisma.user.create({ data: { ...data, password: await bcrypt.hash(password, 10) } });
    res.status(201).json({ id: user.id });
  } catch (e) {
    if (isUniqueViolation(e)) return res.status(409).json({ message: "Nama pengguna sudah dipakai" });
    throw e;
  }
});

router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: "ID tidak valid" });
  const parsed = updateBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { password, ...data } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Pengguna tidak ditemukan" });

  // Selalu sisakan minimal satu Admin aktif supaya tidak ada yang terkunci dari Pengaturan.
  const kehilanganAdmin = existing.role === "ADMIN" && existing.isActive && (data.role !== "ADMIN" || !data.isActive);
  if (kehilanganAdmin) {
    const adminLain = await prisma.user.count({ where: { role: "ADMIN", isActive: true, id: { not: id } } });
    if (adminLain === 0) throw new HttpError(400, "Harus ada minimal satu Admin aktif");
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { ...data, ...(password ? { password: await bcrypt.hash(password, 10) } : {}) },
    });
    res.json({ id });
  } catch (e) {
    if (isUniqueViolation(e)) return res.status(409).json({ message: "Nama pengguna sudah dipakai" });
    throw e;
  }
});

export default router;
