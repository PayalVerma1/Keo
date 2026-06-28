export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  JOIN_SERVICE: "service:join",
  LEAVE_SERVICE: "service:leave",
  METRIC_CREATED: "metric:created",
  LOG_CREATED: "log:created",
  DEPLOYMENT_CREATED: "deployment:created",
  ANOMALY_DETECTED: "anomaly:detected",
} as const;

export const getServiceRoom = (serviceId: string) => {
  return `service:${serviceId}`;
};
