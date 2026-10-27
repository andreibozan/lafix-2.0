-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "ProviderProfile" ADD COLUMN     "creditBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "proCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "leadPriceBani" INTEGER NOT NULL DEFAULT 2000,
ADD COLUMN     "qualification" "QualificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "qualificationNote" TEXT,
ADD COLUMN     "qualifiedAt" TIMESTAMP(3),
ADD COLUMN     "qualifiedBy" TEXT;

-- AlterTable
ALTER TABLE "RequestMatch" ADD COLUMN     "pricePaidBani" INTEGER,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "unlockedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BillingTransaction" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountBani" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferTemplate" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingTransaction_reference_key" ON "BillingTransaction"("reference");

-- CreateIndex
CREATE INDEX "BillingTransaction_providerId_createdAt_idx" ON "BillingTransaction"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "OfferTemplate_providerId_idx" ON "OfferTemplate"("providerId");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceId_createdAt_idx" ON "AuditEvent"("resourceId", "createdAt");

-- AddForeignKey
ALTER TABLE "BillingTransaction" ADD CONSTRAINT "BillingTransaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferTemplate" ADD CONSTRAINT "OfferTemplate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Integer bani and database safeguards prevent negative balances or invalid prices.
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "provider_balance_nonnegative" CHECK ("creditBalance" >= 0);
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "lead_price_positive" CHECK ("leadPriceBani" > 0);
ALTER TABLE "RequestMatch" ADD CONSTRAINT "paid_price_nonnegative" CHECK ("pricePaidBani" IS NULL OR "pricePaidBani" >= 0);
