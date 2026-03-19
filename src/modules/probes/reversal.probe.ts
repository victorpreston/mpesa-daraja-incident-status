import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { ProbeResultEvent } from '../kafka/events/probe-result.event';
import { TOPICS } from '../kafka/topics';
import { ProbeRunner } from './probes.scheduler';

@Injectable()
export class ReversalProbe implements ProbeRunner {
  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
  ) {}

  async run(): Promise<void> {
    const serviceId = await this.getServiceId();
    const start = Date.now();
    let status: 'success' | 'failure' = 'success';
    let errorMessage: string | undefined;
    let responseBody: Record<string, unknown> | undefined;

    try {
      const token = await this.getToken();
      const shortcode = this.config.get<string>('DARAJA_SHORTCODE')!;
      const response = await axios.post<Record<string, unknown>>(
        'https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request',
        {
          Initiator: 'testapi',
          SecurityCredential: 'probe',
          CommandID: 'TransactionReversal',
          TransactionID: 'PROBE00000',
          Amount: 1,
          ReceiverParty: shortcode,
          RecieverIdentifierType: '4',
          ResultURL: `${this.config.get<string>('CALLBACK_BASE_URL')}/daraja/callback`,
          QueueTimeOutURL: `${this.config.get<string>('CALLBACK_BASE_URL')}/daraja/callback`,
          Remarks: 'Probe',
          Occasion: 'Probe',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        },
      );
      responseBody = response.data;
      const responseCode = response.data['ResponseCode'];
      if (responseCode !== '0') {
        status = 'failure';
        errorMessage = `ResponseCode: ${String(responseCode)}`;
      }
    } catch (err: unknown) {
      status = 'failure';
      if (err instanceof Error) errorMessage = err.message;
    }

    const latencyMs = Date.now() - start;
    await this.saveResult(
      serviceId,
      status,
      latencyMs,
      errorMessage,
      responseBody,
    );
    await this.kafka.publish<ProbeResultEvent>(TOPICS.PROBE_RESULT, {
      serviceId,
      serviceName: 'Reversal',
      probeType: 'reversal',
      status,
      latencyMs,
      errorMessage,
      responseBody,
      timestamp: new Date().toISOString(),
    });
  }

  private async getToken(): Promise<string> {
    const key = this.config.get<string>('DARAJA_CONSUMER_KEY')!;
    const secret = this.config.get<string>('DARAJA_CONSUMER_SECRET')!;
    const url = this.config.get<string>('DARAJA_AUTH_URL')!;
    const credentials = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await axios.get<{ access_token: string }>(url, {
      headers: { Authorization: `Basic ${credentials}` },
      timeout: 10000,
    });
    return res.data.access_token;
  }

  private async getServiceId(): Promise<string> {
    const row = await this.postgres
      .db('daraja.services')
      .where({ name: 'Reversal' })
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
      probe_type: 'reversal',
      status,
      latency_ms: latencyMs,
      error_message: errorMessage,
      response_body: responseBody ? JSON.stringify(responseBody) : null,
    });
  }
}
