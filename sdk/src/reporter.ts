import axios from 'axios';
import { DarajaMonitorOptions, TelemetryReport } from './types';

const SDK_VERSION = '1.0.0';

export async function sendReport(
  options: DarajaMonitorOptions,
  report: Omit<TelemetryReport, 'sdkVersion'>,
): Promise<void> {
  if (options.enabled === false) return;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.apiKey) headers['x-api-key'] = options.apiKey;
    await axios.post(
      `${options.serverUrl.replace(/\/$/, '')}/telemetry`,
      { ...report, sdkVersion: SDK_VERSION } satisfies TelemetryReport,
      { timeout: 5000, headers },
    );
  } catch {
    // intentionally silent — monitoring must never break the host app
  }
}
