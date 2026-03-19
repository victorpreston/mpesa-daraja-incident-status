import { AxiosInstance, AxiosError } from 'axios';
import { DarajaMonitorOptions, ErrorType } from './types';
import { detectEndpoint, detectEnvironment, isSafaricomUrl } from './utils';
import { sendReport } from './reporter';

export function attachDarajaMonitor(
  axiosInstance: AxiosInstance,
  options: DarajaMonitorOptions,
): void {
  if (options.enabled === false) return;

  axiosInstance.interceptors.request.use((config) => {
    if (config.url && isSafaricomUrl(config.url)) {
      (config as Record<string, unknown>)['__darajaMonitorStart'] = Date.now();
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const url = error.config?.url ?? '';
      if (!isSafaricomUrl(url)) return Promise.reject(error);

      const start =
        ((error.config as Record<string, unknown>)?.['__darajaMonitorStart'] as number) ??
        Date.now();
      const latencyMs = Date.now() - start;
      const statusCode = error.response?.status;

      let errorType: ErrorType;
      if (error.code === 'ECONNABORTED' || (error.message ?? '').includes('timeout')) {
        errorType = 'timeout';
      } else if (statusCode === 401 || statusCode === 403) {
        errorType = 'auth_error';
      } else if (statusCode) {
        errorType = 'http_error';
      } else {
        errorType = 'network_error';
      }

      void sendReport(options, {
        endpoint: detectEndpoint(url),
        statusCode,
        latencyMs,
        errorType,
        environment: detectEnvironment(url),
      });

      return Promise.reject(error);
    },
  );
}
