export interface Service {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Metric {
  id?: string;
  cpu: number;
  memory: number;
  latency: number;
  errors?: number;
  errorRate?: number;
  throughput?: number;
  serviceId?: string;
  createdAt: string;
}

export interface LogEntry {
  id?: string;
  level: string;
  message: string;
  serviceId: string;
  createdAt: string;
}

export interface Deployment {
  id?: string;
  version: string;
  serviceId: string;
  createdAt: string;
}

export interface Insight {
  id?: string;
  severity: string;
  rootCause: string;
  recommendation: string;
  serviceId: string;
  createdAt: string;
}

export interface ChartPoint {
  time: string;
  value: number;
}
