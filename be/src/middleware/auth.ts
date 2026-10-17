import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { prisma } from "../db.js";

export interface AuthUser {
  id: number;
  role: Role;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export const COOKIE_NAME = "stokify_token";

// Peran dan status aktif dibaca ulang dari database, jadi akun yang dinonaktifkan
// atau diubah perannya langsung berlaku tanpa menunggu token habis.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Belum login" });
  let id: number;
  try {
    id = (jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthUser).id;
  } catch {
    return res.status(401).json({ message: "Sesi tidak valid, silakan login ulang" });
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isActive) return res.status(401).json({ message: "Akun tidak aktif" });
  req.user = { id: user.id, role: user.role };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Tidak punya akses" });
    }
    next();
  };
}
