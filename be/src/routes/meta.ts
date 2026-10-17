import { Router } from "express";
import { HAK_AKSES, KATEGORI, KETERANGAN_KELUAR, PERAN, SATUAN } from "../constants.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ kategori: KATEGORI, satuan: SATUAN, keteranganKeluar: KETERANGAN_KELUAR, peran: PERAN, hakAkses: HAK_AKSES });
});

export default router;
