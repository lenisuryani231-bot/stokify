import { prisma } from "../db.js";

export type StockStatus = "KRITIS" | "PERINGATAN" | "AMAN";

// Kritis: di bawah min stok. Peringatan: masih kurang dari 120% min stok. Selebihnya aman.
export function stockStatus(stok: number, minStok: number): StockStatus {
  if (stok < minStok) return "KRITIS";
  if (stok < minStok * 1.2) return "PERINGATAN";
  return "AMAN";
}

// Stok produk = jumlah sisa semua batch yang belum kadaluwarsa.
export async function stokPerProduk(today: Date): Promise<Map<number, number>> {
  const rows = await prisma.stockBatch.groupBy({
    by: ["productId"],
    where: { tglKadaluwarsa: { gte: today }, qtySisa: { gt: 0 } },
    _sum: { qtySisa: true },
  });
  return new Map(rows.map((r) => [r.productId, r._sum.qtySisa ?? 0]));
}
