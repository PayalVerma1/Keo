export type LogLevel = "info" | "warn" | "error" | "debug";
export interface LogPayload {
  level: LogLevel;
  message: string;
  serviceId: string;
  verificationJobId?: string;
}
export interface MetricPayload {
  cpu: number;      
  memory: number;   
  throughput: number; 
  latency: number;  
  errors: number;    
  serviceId: string;
  routes?: RouteSnapshot[];
}

export interface RouteSnapshot {
  method: string;
  route: string;
  count: number;
  errors: number;
  latencyP50: number;
  latencyP95: number;
}

export interface DeploymentPayload {
  version: string;   
  serviceId: string;
}

export interface MonitorConfig {
  apiKey: string;           
  serviceId: string;        
  baseUrl?: string;          
  metricsInterval?: number;  // How often to auto-send metrics in ms (default: 30000)
  logBatchSize?: number;     // How many logs to collect before sending (default: 10)
  logFlushInterval?: number; // How long to wait before sending logs in ms (default: 5000)
  silent?: boolean;          // If true, suppresses all console output
  verificationJobId?: string; // Correlates sandbox telemetry with a KEO PR verification job
}
