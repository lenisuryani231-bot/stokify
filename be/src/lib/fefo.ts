import type { Prisma } from "@prisma/client";
import { KETERANGAN_KADALUWARSA } from "../constants.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Tx = Prisma.TransactionClient;

export interface BatchRow {
  id: number;
  qtySisa: number;
  tglKadaluwarsa: Date;
}

export interface Allocation {
  batchId: number;
  qty: number;
  tglKadaluwarsa: Date;
}

// Kunci semua batch produk agar dua pengeluaran bersamaan tidak memakai stok yang sama.
export async function lockProductBatches(tx: Tx, productIds: number[]) {
  const ids = [...new Set(productIds)].sort((a, b) => a - b);
  for (const id of ids) {
    await tx.$queryRaw`SELECT id FROM "StockBatch" WHERE "productId" = ${id} ORDER BY id FOR UPDATE`;
  }
}

// Batch yang boleh dipakai: yang belum kadaluwarsa, kecuali untuk pemusnahan barang kadaluwarsa.
export function batchFilter(today: Date, keterangan: string) {
  return {
    qtySisa: { gt: 0 },
    ...(keterangan === KETERANGAN_KADALUWARSA ? {} : { tglKadaluwarsa: { gte: today } }),
  };
}

export const fefoOrder = [{ tglKadaluwarsa: "asc" }, { tglTerima: "asc" }, { id: "asc" }] as const;

// FEFO: ambil dari batch yang paling dekat kadaluwarsanya sampai qty terpenuhi.
export function planFefo(batches: BatchRow[], qty: number): { plan: Allocation[]; tersedia: number } {
  const tersedia = batches.reduce((a, b) => a + b.qtySisa, 0);
  const plan: Allocation[] = [];
  let sisa = qty;
  for (const b of batches) {
    if (sisa <= 0) break;
    const ambil = Math.min(b.qtySisa, sisa);
    plan.push({ batchId: b.id, qty: ambil, tglKadaluwarsa: b.tglKadaluwarsa });
    sisa -= ambil;
  }
  return { plan, tersedia };
}

export function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}
