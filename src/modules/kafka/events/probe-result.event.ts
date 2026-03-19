export interface ProbeResultEvent {
  serviceId: string;
  serviceName: string;
  probeType: string;
  status: 'success' | 'failure';
  latencyMs: number;
  errorMessage?: string;
  responseBody?: Record<string, unknown>;
  timestamp: string;
}
