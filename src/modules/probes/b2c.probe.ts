import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { ProbeResultEvent } from '../kafka/events/probe-result.event';
import { TOPICS } from '../kafka/topics';
import { DarajaTokenService } from './daraja-token.service';
import { ProbeRunner } from './probes.scheduler';

@Injectable()
export class B2cProbe implements ProbeRunner {
  private readonly logger = new Logger(B2cProbe.name);

  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
    private readonly darajaToken: DarajaTokenService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('b2c: running');
    const serviceId = await this.getServiceId();
    const start = Date.now();
    let status: 'success' | 'failure' = 'success';
    let errorMessage: string | undefined;
    let responseBody: Record<string, unknown> | undefined;

    try {
      const token = await this.darajaToken.getToken();
      const shortcode = this.config.get<string>('DARAJA_SHORTCODE')!;
      const response = await axios.post<Record<string, unknown>>(
        'https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest',
        {
          OriginatorConversationID: `probe-${Date.now()}`,
          InitiatorName: this.config.get<string>('DARAJA_INITIATOR_NAME')!,
          SecurityCredential: this.config.get<string>(
            'DARAJA_SECURITY_CREDENTIAL',
          )!,
          CommandID: 'BusinessPayment',
          Amount: 1,
          PartyA: shortcode,
          PartyB: '254708374149',
          Remarks: 'Probe',
          QueueTimeOutURL: this.config.get<string>('DARAJA_CALLBACK_URL')!,
          ResultURL: this.config.get<string>('DARAJA_CALLBACK_URL')!,
          Occasion: 'Probe',
        },
        { headers: this.darajaToken.headers(token), timeout: 15000 },
      );
      responseBody = response.data;
      this.logger.log(
        `b2c: HTTP ${response.status} | ${JSON.stringify(responseBody).slice(0, 500)}`,
      );
      const responseCode = response.data['ResponseCode'];
      if (responseCode !== '0') {
        status = 'failure';
        errorMessage = `ResponseCode: ${String(responseCode)}`;
      }
    } catch (err: unknown) {
      status = 'failure';
      if (axios.isAxiosError(err)) {
        errorMessage = err.message;
        responseBody = err.response?.data as
          | Record<string, unknown>
          | undefined;
        this.logger.error(
          `b2c: HTTP ${err.response?.status ?? 'ERR'} ${err.config?.url ?? ''}`,
          JSON.stringify(err.response?.data ?? '').slice(0, 2000),
        );
      } else if (err instanceof Error) {
        errorMessage = err.message;
        this.logger.error(`b2c: ${err.message}`);
      }
    }

    const latencyMs = Date.now() - start;
    if (status === 'success') {
      this.logger.log(`b2c: success | ${latencyMs}ms`);
    } else {
      this.logger.error(`b2c: failure | ${latencyMs}ms | ${errorMessage}`);
    }
    await this.saveResult(
      serviceId,
      status,
      latencyMs,
      errorMessage,
      responseBody,
    );
    await this.kafka.publish<ProbeResultEvent>(TOPICS.PROBE_RESULT, {
      serviceId,
      serviceName: 'B2C',
      probeType: 'b2c',
      status,
      latencyMs,
      errorMessage,
      responseBody,
      timestamp: new Date().toISOString(),
    });
  }

  private async getServiceId(): Promise<string> {
    const row = await this.postgres
      .db('daraja.services')
      .where({ name: 'B2C' })
      .first();
    return row.id as string;
  }

  private async saveResult(
    serviceId: string,
    status: string,
    latencyMs: number,
    errorMessage?: string,
    responseBody?: Record<string, unknown>,
  ): Promise<void> {
    await this.postgres.db('daraja.probe_results').insert({
      service_id: serviceId,
      probe_type: 'b2c',
      status,
      latency_ms: latencyMs,
      error_message: errorMessage,
      response_body: responseBody ? JSON.stringify(responseBody) : null,
    });
  }
}
