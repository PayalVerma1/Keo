CREATE INDEX "Service_ownerID_createdAt_idx" ON "Service"("ownerID", "createdAt");
CREATE INDEX "Metrics_serviceId_createdAt_idx" ON "Metrics"("serviceId", "createdAt");
CREATE INDEX "Logs_serviceId_createdAt_idx" ON "Logs"("serviceId", "createdAt");
