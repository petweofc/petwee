/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('PF', 'PJ');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "personType" "PersonType",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "stateRegistration" TEXT,
ADD COLUMN     "tradeName" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "User_cnpj_key" ON "User"("cnpj");
