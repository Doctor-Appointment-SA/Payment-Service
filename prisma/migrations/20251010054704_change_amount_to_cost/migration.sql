/*
  Warnings:

  - You are about to drop the column `amount` on the `payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payment" DROP COLUMN "amount",
ADD COLUMN     "cost" DOUBLE PRECISION;
