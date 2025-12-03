-- CreateTable
CREATE TABLE "EsimUsageHistory" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "usedBytes" BIGINT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EsimUsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EsimUsageHistory_profileId_idx" ON "EsimUsageHistory"("profileId");

-- CreateIndex
CREATE INDEX "EsimUsageHistory_profileId_recordedAt_idx" ON "EsimUsageHistory"("profileId", "recordedAt");

-- AddForeignKey
ALTER TABLE "EsimUsageHistory" ADD CONSTRAINT "EsimUsageHistory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "EsimProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
