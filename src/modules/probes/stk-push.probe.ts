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
export class StkPushProbe implements ProbeRunner {
  private readonly logger = new Logger(StkPushProbe.name);

  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
    private readonly darajaToken: DarajaTokenService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('stk-push: running');
    const serviceId = await this.getServiceId();
    const start = Date.now();
    let status: 'success' | 'failure' = 'success';
    let errorMessage: string | undefined;
    let responseBody: Record<string, unknown> | undefined;

    try {
      const token = await this.darajaToken.getToken();
      const shortcode = this.config.get<string>('DARAJA_STK_SHORTCODE')!;
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, 14);
      const passkey = this.config.get<string>('DARAJA_PASSKEY')!;
      const password = Buffer.from(
        `${shortcode}${passkey}${timestamp}`,
      ).toString('base64');
      const response = await axios.post<Record<string, unknown>>(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: 1,
          PartyA: '254708374149',
          PartyB: shortcode,
          PhoneNumber: '254708374149',
          CallBackURL: this.config.get<string>('DARAJA_CALLBACK_URL')!,
          AccountReference: 'ProbeCheck',
          TransactionDesc: 'Probe',
        },
        { headers: this.darajaToken.headers(token), timeout: 15000 },
      );
      responseBody = response.data;
      this.logger.log(
        `stk-push: HTTP ${response.status} | ${JSON.stringify(responseBody).slice(0, 500)}`,
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
          `stk-push: HTTP ${err.response?.status ?? 'ERR'} ${err.config?.url ?? ''}`,
          JSON.stringify(err.response?.data ?? '').slice(0, 2000),
        );
      } else if (err instanceof Error) {
        errorMessage = err.message;
        this.logger.error(`stk-push: ${err.message}`);
      }
    }

    const latencyMs = Date.now() - start;
    if (status === 'success') {
      this.logger.log(`stk-push: success | ${latencyMs}ms`);
    } else {
      this.logger.error(`stk-push: failure | ${latencyMs}ms | ${errorMessage}`);
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
      serviceName: 'STK Push',
      probeType: 'stk-push',
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
      .where({ name: 'STK Push' })
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
      probe_type: 'stk-push',
      status,
      latency_ms: latencyMs,
      error_message: errorMessage,
      response_body: responseBody ? JSON.stringify(responseBody) : null,
    });
  }
}
