/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "ie" TEXT,
ADD COLUMN     "ieExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ieState" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_cnpj_key" ON "User"("cnpj");
