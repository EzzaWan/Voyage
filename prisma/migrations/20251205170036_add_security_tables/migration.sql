-- CreateTable
CREATE TABLE "SecurityEventLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ip" TEXT,
    "userId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityEventLog_type_idx" ON "SecurityEventLog"("type");

-- CreateIndex
CREATE INDEX "SecurityEventLog_ip_idx" ON "SecurityEventLog"("ip");

-- CreateIndex
CREATE INDEX "SecurityEventLog_userId_idx" ON "SecurityEventLog"("userId");

-- CreateIndex
CREATE INDEX "SecurityEventLog_createdAt_idx" ON "SecurityEventLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MobileToken_token_key" ON "MobileToken"("token");

-- CreateIndex
CREATE INDEX "MobileToken_userId_idx" ON "MobileToken"("userId");

-- CreateIndex
CREATE INDEX "MobileToken_expiresAt_idx" ON "MobileToken"("expiresAt");

-- CreateIndex
CREATE INDEX "MobileToken_token_idx" ON "MobileToken"("token");

-- AddForeignKey
ALTER TABLE "MobileToken" ADD CONSTRAINT "MobileToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "SupportTicket" ALTER COLUMN "message" SET DATA TYPE VARCHAR(1000);

-- CreateIndex (if unique constraint doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "EsimProfile_iccid_key" ON "EsimProfile"("iccid");

-- CreateIndex (if unique constraint doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentRef_key" ON "Order"("paymentRef");

