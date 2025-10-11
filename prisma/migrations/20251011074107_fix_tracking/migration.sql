/*
  Warnings:

  - A unique constraint covering the columns `[payment_id]` on the table `tracking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."tracking" DROP CONSTRAINT "tracking_payment_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "tracking_payment_id_key" ON "tracking"("payment_id");

-- AddForeignKey
ALTER TABLE "tracking" ADD CONSTRAINT "tracking_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
