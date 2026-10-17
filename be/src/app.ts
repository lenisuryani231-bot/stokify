import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import metaRouter from "./routes/meta.js";
import productsRouter from "./routes/products.js";
import suppliersRouter from "./routes/suppliers.js";
import dashboardRouter from "./routes/dashboard.js";
import stockInRouter from "./routes/stockIn.js";
import stockOutRouter from "./routes/stockOut.js";
import usersRouter from "./routes/users.js";
import { HttpError } from "./lib/fefo.js";
import { requireAuth } from "./middleware/auth.js";

const isProd = process.env.NODE_ENV === "production";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diisi");
if (!process.env.JWT_SECRET || (isProd && process.env.JWT_SECRET.length < 32)) {
  throw new Error("JWT_SECRET belum diisi (di produksi minimal 32 karakter)");
}

const app = express();

// Di belakang proxy (Render, dll.) supaya IP klien dan cookie secure terbaca benar
app.set("trust proxy", 1);
app.use(helmet());
// Tanpa FRONTEND_ORIGIN, API hanya dipakai same-origin (lewat proxy / rewrite) sehingga CORS tidak perlu
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || false, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Terlalu banyak percobaan login, coba lagi beberapa menit lagi" },
});
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRouter);
app.use("/api/meta", requireAuth, metaRouter);
app.use("/api/products", requireAuth, productsRouter);
app.use("/api/suppliers", requireAuth, suppliersRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/stock-in", requireAuth, stockInRouter);
app.use("/api/stock-out", requireAuth, stockOutRouter);
app.use("/api/users", requireAuth, usersRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server" });
});

export default app;
