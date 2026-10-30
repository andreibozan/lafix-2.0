ALTER TABLE "ProviderProfile" ADD COLUMN "biography" TEXT NOT NULL DEFAULT '', ADD COLUMN "availability" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ServiceRequest" ADD COLUMN "completedAt" TIMESTAMP(3), ADD COLUMN "reviewRating" INTEGER, ADD COLUMN "reviewText" TEXT, ADD COLUMN "reviewPublished" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "followUpOwner" TEXT, ADD COLUMN "followUpNote" TEXT;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "review_rating_range" CHECK ("reviewRating" BETWEEN 1 AND 5);
ALTER TABLE "Offer" ADD COLUMN "scope" TEXT NOT NULL DEFAULT '', ADD COLUMN "materials" TEXT NOT NULL DEFAULT '', ADD COLUMN "timeframe" TEXT NOT NULL DEFAULT '', ADD COLUMN "warranty" TEXT NOT NULL DEFAULT '';
