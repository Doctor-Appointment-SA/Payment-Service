/*
  Warnings:

  - You are about to drop the column `medication` on the `prescription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[prescription_id]` on the table `payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "prescription" DROP COLUMN "medication";

-- CreateIndex
CREATE UNIQUE INDEX "payment_prescription_id_key" ON "payment"("prescription_id");
