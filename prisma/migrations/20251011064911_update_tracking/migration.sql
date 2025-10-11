/*
  Warnings:

  - You are about to drop the column `prescription_id` on the `tracking` table. All the data in the column will be lost.
  - The `status` column on the `tracking` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('PREPARE', 'SENDING', 'SUCCESS');

-- DropForeignKey
ALTER TABLE "public"."tracking" DROP CONSTRAINT "tracking_prescription_id_fkey";

-- AlterTable
ALTER TABLE "tracking" DROP COLUMN "prescription_id",
ADD COLUMN     "payment_id" UUID,
DROP COLUMN "status",
ADD COLUMN     "status" "TrackingStatus";

-- AddForeignKey
ALTER TABLE "tracking" ADD CONSTRAINT "tracking_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "prescription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
