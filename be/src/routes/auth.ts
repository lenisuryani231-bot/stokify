import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { COOKIE_NAME, requireAuth } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Nama pengguna wajib diisi"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  remember: z.boolean().optional(),
});

const DAY_MS = 24 * 60 * 60 * 1000;

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { username, password, remember } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  const ok = user && user.isActive && (await bcrypt.compare(password, user.password));
  if (!user || !ok) {
    return res.status(401).json({ message: "Nama pengguna atau kata sandi salah" });
  }

  const days = remember ? 30 : 1;
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: `${days}d`,
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? days * DAY_MS : undefined,
  });
  res.json({ id: user.id, nama: user.nama, username: user.username, role: user.role });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !user.isActive) return res.status(401).json({ message: "Akun tidak aktif" });
  res.json({ id: user.id, nama: user.nama, username: user.username, role: user.role });
});

export default router;
