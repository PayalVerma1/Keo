ALTER TABLE "Metrics" ADD COLUMN "verificationJobId" TEXT;

CREATE INDEX "Metrics_serviceId_verificationJobId_createdAt_idx"
ON "Metrics"("serviceId", "verificationJobId", "createdAt");
