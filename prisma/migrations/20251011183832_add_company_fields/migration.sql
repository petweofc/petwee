/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "ie" TEXT,
ADD COLUMN     "ieExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ieState" TEXT;

-- CreateIndex
-- cnpj já criado em migração anterior; índice removido para evitar duplicação
