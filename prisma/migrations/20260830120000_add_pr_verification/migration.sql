-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('QUEUED', 'COLLECTING', 'PROCESSING', 'PASSED', 'WARNING', 'FAILED', 'ERROR');

-- CreateTable
CREATE TABLE "VerificationJob" (
    "id" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'QUEUED',
    "repository" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "pullRequestNumber" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "baselineServiceId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "thresholds" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationBaseline" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationReport" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "summary" TEXT NOT NULL,
    "comparisons" JSONB NOT NULL,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationJob_status_createdAt_idx" ON "VerificationJob"("status", "createdAt");
CREATE INDEX "VerificationJob_repository_pullRequestNumber_idx" ON "VerificationJob"("repository", "pullRequestNumber");
CREATE INDEX "VerificationBaseline_serviceId_capturedAt_idx" ON "VerificationBaseline"("serviceId", "capturedAt");
CREATE UNIQUE INDEX "VerificationReport_jobId_key" ON "VerificationReport"("jobId");

-- AddForeignKey
ALTER TABLE "VerificationJob" ADD CONSTRAINT "VerificationJob_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VerificationBaseline" ADD CONSTRAINT "VerificationBaseline_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VerificationReport" ADD CONSTRAINT "VerificationReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "VerificationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
