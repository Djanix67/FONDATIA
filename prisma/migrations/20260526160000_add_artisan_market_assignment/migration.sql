-- CreateEnum
CREATE TYPE "MarketExecutionStatus" AS ENUM ('OPEN', 'ASSIGNED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Market"
ADD COLUMN     "assignedArtisanUserId" TEXT,
ADD COLUMN     "assignedArtisanCompanyId" TEXT,
ADD COLUMN     "executionStatus" "MarketExecutionStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Market_assignedArtisanUserId_executionStatus_idx" ON "Market"("assignedArtisanUserId", "executionStatus");

-- CreateIndex
CREATE INDEX "Market_assignedArtisanCompanyId_executionStatus_idx" ON "Market"("assignedArtisanCompanyId", "executionStatus");

-- AddForeignKey
ALTER TABLE "Market"
ADD CONSTRAINT "Market_assignedArtisanUserId_fkey"
FOREIGN KEY ("assignedArtisanUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market"
ADD CONSTRAINT "Market_assignedArtisanCompanyId_fkey"
FOREIGN KEY ("assignedArtisanCompanyId") REFERENCES "Company"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
