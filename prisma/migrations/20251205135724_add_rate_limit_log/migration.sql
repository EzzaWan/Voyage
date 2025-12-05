-- CreateTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userId" TEXT,
    "route" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitLog_ip_idx" ON "RateLimitLog"("ip");

-- CreateIndex
CREATE INDEX "RateLimitLog_userId_idx" ON "RateLimitLog"("userId");

-- CreateIndex
CREATE INDEX "RateLimitLog_createdAt_idx" ON "RateLimitLog"("createdAt");

-- CreateIndex
CREATE INDEX "RateLimitLog_route_idx" ON "RateLimitLog"("route");
