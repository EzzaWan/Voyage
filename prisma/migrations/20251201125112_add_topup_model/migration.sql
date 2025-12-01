-- CreateTable
CREATE TABLE "TopUp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentRef" TEXT,
    "rechargeOrder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopUp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TopUp" ADD CONSTRAINT "TopUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUp" ADD CONSTRAINT "TopUp_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "EsimProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
