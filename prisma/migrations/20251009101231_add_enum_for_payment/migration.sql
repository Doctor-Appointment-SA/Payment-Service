/*
  Warnings:

  - The `status` column on the `payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `method` column on the `payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CANCEL', 'SUCCESS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT', 'PROMPTPAY', 'BANK', 'CASH');

-- AlterTable
ALTER TABLE "payment" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "method",
ADD COLUMN     "method" "PaymentMethod";
