-- CreateEnum
CREATE TYPE "UnitMethod" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP');

-- AlterTable
ALTER TABLE "medication" ADD COLUMN     "strength" DOUBLE PRECISION,
ADD COLUMN     "unit" "UnitMethod";
