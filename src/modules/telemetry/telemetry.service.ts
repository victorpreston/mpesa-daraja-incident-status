import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { ProbeResultEvent } from '../kafka/events/probe-result.event';
import { TOPICS } from '../kafka/topics';
import { ReportTelemetryDto } from './dto/report-telemetry.dto';

const ENDPOINT_SERVICE_MAP: Record<string, string> = {
  'stk-push': 'STK Push',
  oauth: 'OAuth',
  c2b: 'C2B',
  b2c: 'B2C',
  'account-balance': 'Account Balance',
  'transaction-status': 'Transaction Status',
  reversal: 'Reversal',
};

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
  ) {}

  async report(dto: ReportTelemetryDto): Promise<void> {
    const serviceName = ENDPOINT_SERVICE_MAP[dto.endpoint];
    const serviceId = serviceName
      ? await this.getServiceId(serviceName)
      : undefined;

    await this.postgres.db('daraja.telemetry_reports').insert({
      service_id: serviceId ?? null,
      endpoint: dto.endpoint,
      error_type: dto.errorType,
      status_code: dto.statusCode ?? null,
      latency_ms: dto.latencyMs,
      environment: dto.environment ?? 'sandbox',
      sdk_version: dto.sdkVersion ?? null,
    });

    if (serviceId && serviceName) {
      const event: ProbeResultEvent = {
        serviceId,
        serviceName,
        probeType: `telemetry-${dto.endpoint}`,
        status: 'failure',
        latencyMs: dto.latencyMs,
        errorMessage: `${dto.errorType}${dto.statusCode ? ` (HTTP ${dto.statusCode})` : ''}`,
        responseBody: undefined,
        timestamp: new Date().toISOString(),
      };
      await this.kafka.publish<ProbeResultEvent>(TOPICS.PROBE_TELEMETRY, event);
      this.logger.log(
        `Telemetry: ${dto.endpoint} | ${dto.errorType} | ${dto.latencyMs}ms | ${dto.environment ?? 'sandbox'}`,
      );
    }
  }

  private async getServiceId(name: string): Promise<string | undefined> {
    const row = await this.postgres
      .db('daraja.services')
      .where({ name })
      .first();
    return row?.id as string | undefined;
  }
}
