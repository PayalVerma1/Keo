import { Prisma, VerificationStatus } from "@/lib/generated/prisma";
import { prisma } from "../../config/prisma";

export type VerificationThresholds = Partial<{
  cpu: number;
  memory: number;
  latency: number;
  errors: number;
}>;

type CreateVerificationJobInput = {
  repository: string;
  commitSha: string;
  pullRequestNumber: number;
  serviceId: string;
  baselineServiceId?: string;
  thresholds?: VerificationThresholds;
  metadata?: Record<string, unknown>;
};

export async function createVerificationJob(input: CreateVerificationJobInput) {
  return prisma.verificationJob.create({
    data: {
      repository: input.repository,
      commitSha: input.commitSha,
      pullRequestNumber: input.pullRequestNumber,
      serviceId: input.serviceId,
      baselineServiceId: input.baselineServiceId,
      thresholds: (input.thresholds ?? {}) as Prisma.InputJsonValue,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function completeVerificationJob(id: string) {
  return prisma.verificationJob.update({
    where: { id },
    data: { status: VerificationStatus.COLLECTING, completedAt: new Date() },
  });
}

export async function getVerificationJob(id: string) {
  return prisma.verificationJob.findUnique({
    where: { id },
    include: { report: true },
  });
}
