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
export class C2bPaybillProbe implements ProbeRunner {
  private readonly logger = new Logger(C2bPaybillProbe.name);

  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
    private readonly darajaToken: DarajaTokenService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('c2b-paybill: running');
    const serviceId = await this.getServiceId();
    const start = Date.now();
    let status: 'success' | 'failure' = 'success';
    let errorMessage: string | undefined;
    let responseBody: Record<string, unknown> | undefined;

    try {
      const token = await this.darajaToken.getToken();
      const shortcode = this.config.get<string>('DARAJA_SHORTCODE')!;
      const response = await axios.post<Record<string, unknown>>(
        this.config.get<string>('DARAJA_SIMULATE_URL')!,
        {
          ShortCode: shortcode,
          CommandID: 'CustomerPayBillOnline',
          Amount: 1,
          Msisdn: '254708374149',
          BillRefNumber: 'ProbeCheck',
        },
        { headers: this.darajaToken.headers(token), timeout: 15000 },
      );
      responseBody = response.data;
      this.logger.log(
        `c2b-paybill: HTTP ${response.status} | ${JSON.stringify(responseBody).slice(0, 500)}`,
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
          `c2b-paybill: HTTP ${err.response?.status ?? 'ERR'} ${err.config?.url ?? ''}`,
          JSON.stringify(err.response?.data ?? '').slice(0, 2000),
        );
      } else if (err instanceof Error) {
        errorMessage = err.message;
        this.logger.error(`c2b-paybill: ${err.message}`);
      }
    }

    const latencyMs = Date.now() - start;
    if (status === 'success') {
      this.logger.log(`c2b-paybill: success | ${latencyMs}ms`);
    } else {
      this.logger.error(
        `c2b-paybill: failure | ${latencyMs}ms | ${errorMessage}`,
      );
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
      serviceName: 'C2B',
      probeType: 'c2b-paybill',
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
      .where({ name: 'C2B' })
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
      probe_type: 'c2b-paybill',
      status,
      latency_ms: latencyMs,
      error_message: errorMessage,
      response_body: responseBody ? JSON.stringify(responseBody) : null,
    });
  }
}
