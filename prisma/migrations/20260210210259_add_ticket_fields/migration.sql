-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "satisfactionScore" INTEGER,
ADD COLUMN     "slaTargetDate" TIMESTAMP(3),
ADD COLUMN     "subcategory" TEXT;
