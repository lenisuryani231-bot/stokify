-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAF_GUDANG', 'STAF_AREA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "namaPic" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "minStok" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "tglTerima" DATE NOT NULL,
    "tglKadaluwarsa" DATE NOT NULL,
    "qtyMasuk" INTEGER NOT NULL,
    "qtySisa" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOut" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "tglKeluar" DATE NOT NULL,
    "qty" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "dibatalkan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOutItem" (
    "id" SERIAL NOT NULL,
    "stockOutId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "StockOutItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "StockBatch_productId_tglKadaluwarsa_idx" ON "StockBatch"("productId", "tglKadaluwarsa");

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOut" ADD CONSTRAINT "StockOut_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOutItem" ADD CONSTRAINT "StockOutItem_stockOutId_fkey" FOREIGN KEY ("stockOutId") REFERENCES "StockOut"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOutItem" ADD CONSTRAINT "StockOutItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
