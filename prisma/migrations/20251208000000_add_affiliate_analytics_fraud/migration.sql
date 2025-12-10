-- CreateTable
CREATE TABLE IF NOT EXISTS "AffiliateClick" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "deviceFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AffiliateSignup" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "deviceFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AffiliateFraudEvent" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "userId" TEXT,
    "relatedId" TEXT,
    "type" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateFraudEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AffiliateFraudScore" (
    "affiliateId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateFraudScore_pkey" PRIMARY KEY ("affiliateId")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateClick_affiliateId_idx" ON "AffiliateClick"("affiliateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateClick_referralCode_idx" ON "AffiliateClick"("referralCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateClick_createdAt_idx" ON "AffiliateClick"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateClick_deviceFingerprint_idx" ON "AffiliateClick"("deviceFingerprint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateClick_ipAddress_idx" ON "AffiliateClick"("ipAddress");

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateSignup_userId_key" ON "AffiliateSignup"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateSignup_affiliateId_idx" ON "AffiliateSignup"("affiliateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateSignup_referralCode_idx" ON "AffiliateSignup"("referralCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateSignup_createdAt_idx" ON "AffiliateSignup"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateSignup_deviceFingerprint_idx" ON "AffiliateSignup"("deviceFingerprint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateFraudEvent_affiliateId_idx" ON "AffiliateFraudEvent"("affiliateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateFraudEvent_type_idx" ON "AffiliateFraudEvent"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateFraudEvent_createdAt_idx" ON "AffiliateFraudEvent"("createdAt");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateClick_affiliateId_fkey'
    ) THEN
        ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliateId_fkey" 
            FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateSignup_affiliateId_fkey'
    ) THEN
        ALTER TABLE "AffiliateSignup" ADD CONSTRAINT "AffiliateSignup_affiliateId_fkey" 
            FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateSignup_userId_fkey'
    ) THEN
        ALTER TABLE "AffiliateSignup" ADD CONSTRAINT "AffiliateSignup_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateFraudEvent_affiliateId_fkey'
    ) THEN
        ALTER TABLE "AffiliateFraudEvent" ADD CONSTRAINT "AffiliateFraudEvent_affiliateId_fkey" 
            FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateFraudScore_affiliateId_fkey'
    ) THEN
        ALTER TABLE "AffiliateFraudScore" ADD CONSTRAINT "AffiliateFraudScore_affiliateId_fkey" 
            FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Add isFrozen column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Affiliate' AND column_name = 'isFrozen'
    ) THEN
        ALTER TABLE "Affiliate" ADD COLUMN "isFrozen" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

