-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "metricContext" JSONB,
    "logContext" JSONB,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Insight_serviceId_createdAt_idx" ON "Insight"("serviceId", "createdAt");

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
