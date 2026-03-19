import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { ProbeResultEvent } from '../kafka/events/probe-result.event';
import { TOPICS } from '../kafka/topics';

@Injectable()
export class CallbackService {
  private readonly logger = new Logger(CallbackService.name);

  constructor(
    private readonly kafka: KafkaService,
    private readonly postgres: PostgresService,
  ) {}

  private async getServiceId(name: string): Promise<string> {
    const row = await this.postgres
      .db('daraja.services')
      .where({ name })
      .first();
    return (row?.id as string) ?? '';
  }

  async handle(body: Record<string, unknown>): Promise<void> {
    this.logger.log(`Daraja callback received: ${JSON.stringify(body)}`);

    const stkBody = body['Body'] as Record<string, unknown> | undefined;
    const stkCallback = stkBody?.['stkCallback'] as
      | Record<string, unknown>
      | undefined;

    if (stkCallback) {
      const resultCode = stkCallback['ResultCode'];
      const status = resultCode === 0 ? 'success' : 'failure';
      const serviceId = await this.getServiceId('STK Push');
      const event: ProbeResultEvent = {
        serviceId,
        serviceName: 'STK Push',
        probeType: 'stk-push-callback',
        status,
        latencyMs: 0,
        errorMessage:
          status === 'failure'
            ? String(stkCallback['ResultDesc'] ?? 'Unknown')
            : undefined,
        responseBody: body,
        timestamp: new Date().toISOString(),
      };
      await this.kafka.publish<ProbeResultEvent>(TOPICS.PROBE_CALLBACKS, event);
      return;
    }

    const result = body['Result'] as Record<string, unknown> | undefined;
    if (result) {
      const resultCode = result['ResultCode'];
      const status = resultCode === 0 ? 'success' : 'failure';
      const resultType = result['TransactionType'] as string | undefined;
      const serviceName = resultType === 'BusinessPayment' ? 'B2C' : 'B2C';
      const serviceId = await this.getServiceId(serviceName);
      const event: ProbeResultEvent = {
        serviceId,
        serviceName,
        probeType: 'b2c-callback',
        status,
        latencyMs: 0,
        errorMessage:
          status === 'failure'
            ? String(result['ResultDesc'] ?? 'Unknown')
            : undefined,
        responseBody: body,
        timestamp: new Date().toISOString(),
      };
      await this.kafka.publish<ProbeResultEvent>(TOPICS.PROBE_CALLBACKS, event);
    }
  }
}
