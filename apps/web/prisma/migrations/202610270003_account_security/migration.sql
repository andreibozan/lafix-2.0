-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "mfaEnabledAt" TIMESTAMP(3),
ADD COLUMN     "mfaLastCounter" BIGINT,
ADD COLUMN     "mfaPendingExpiresAt" TIMESTAMP(3),
ADD COLUMN     "mfaPendingSecret" TEXT,
ADD COLUMN     "mfaRecoveryHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mfaSecret" TEXT;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "guestTicketHash" TEXT,
ADD COLUMN     "requestSource" TEXT NOT NULL DEFAULT 'ACCOUNT';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "mfaVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AccountActionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountActionToken_tokenHash_key" ON "AccountActionToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountActionToken_userId_kind_createdAt_idx" ON "AccountActionToken"("userId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "AccountActionToken_expiresAt_idx" ON "AccountActionToken"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_sentAt_nextAttemptAt_idx" ON "EmailOutbox"("sentAt", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_expiresAt_idx" ON "EmailOutbox"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_guestTicketHash_key" ON "ServiceRequest"("guestTicketHash");

-- AddForeignKey
ALTER TABLE "AccountActionToken" ADD CONSTRAINT "AccountActionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

