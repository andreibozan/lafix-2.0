-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "LeadReport" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAttemptBucket" (
    "id" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthAttemptBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadReport_matchId_key" ON "LeadReport"("matchId");

-- CreateIndex
CREATE INDEX "LeadReport_status_createdAt_idx" ON "LeadReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttemptBucket_resetAt_idx" ON "AuthAttemptBucket"("resetAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "ProviderProfile_createdAt_idx" ON "ProviderProfile"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Offer_createdAt_idx" ON "Offer"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "LeadReport" ADD CONSTRAINT "LeadReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "RequestMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Preserve pre-existing report audits as operational tickets, without duplicating matches.
INSERT INTO "LeadReport" ("id","matchId","reason","note","status","createdAt")
SELECT DISTINCT ON (a."resourceId") 'legacy-' || a."id", m."id",
 CASE WHEN split_part(COALESCE(a."note",''),':',1) IN ('INVALID_CONTACT','DUPLICATE','FALSE_REQUEST') THEN split_part(a."note",':',1) ELSE 'INVALID_CONTACT' END,
 COALESCE(a."note",'Sesizare preluată din jurnal'),
 CASE WHEN m."refundedAt" IS NOT NULL THEN 'RESOLVED'::"ReportStatus" ELSE 'OPEN'::"ReportStatus" END,
 a."createdAt"
FROM "AuditEvent" a JOIN "RequestMatch" m ON m."id"=a."resourceId"
WHERE a."action"='LEAD_REPORTED'
ORDER BY a."resourceId",a."createdAt" ASC
ON CONFLICT ("matchId") DO NOTHING;
UPDATE "LeadReport" r SET "resolvedAt"=m."refundedAt", "resolutionNote"='Credit restituit înainte de migrarea sesizării'
FROM "RequestMatch" m WHERE r."matchId"=m."id" AND r."status"='RESOLVED' AND r."resolvedAt" IS NULL AND m."refundedAt" IS NOT NULL;
