-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "displayAmountCents" INTEGER,
ADD COLUMN     "displayCurrency" TEXT;

-- AlterTable
ALTER TABLE "TopUp" ADD COLUMN     "displayCurrency" TEXT;
