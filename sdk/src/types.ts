export interface DarajaMonitorOptions {
  serverUrl: string;
  apiKey?: string;
  enabled?: boolean;
}

export type DarajaEndpoint =
  | 'stk-push'
  | 'oauth'
  | 'c2b'
  | 'b2c'
  | 'account-balance'
  | 'transaction-status'
  | 'reversal'
  | 'unknown';

export type ErrorType = 'timeout' | 'http_error' | 'network_error' | 'auth_error';

export interface TelemetryReport {
  endpoint: DarajaEndpoint;
  statusCode?: number;
  latencyMs: number;
  errorType: ErrorType;
  sdkVersion: string;
  environment: 'sandbox' | 'production';
}
