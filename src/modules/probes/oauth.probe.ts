import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { ProbeResultEvent } from '../kafka/events/probe-result.event';
import { TOPICS } from '../kafka/topics';
import { DarajaTokenService } from './daraja-token.service';
import { ProbeRunner } from './probes.scheduler';

@Injectable()
export class OauthProbe implements ProbeRunner {
  private readonly logger = new Logger(OauthProbe.name);

  constructor(
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
    private readonly darajaToken: DarajaTokenService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('oauth: running');
    const serviceId = await this.getServiceId();
    const start = Date.now();
    let status: 'success' | 'failure' = 'success';
    let errorMessage: string | undefined;
    let responseBody: Record<string, unknown> | undefined;

    try {
      const token = await this.darajaToken.getToken();
      this.logger.log('oauth: token obtained successfully');
      responseBody = { access_token: `${token.slice(0, 8)}...` };
    } catch (err: unknown) {
      status = 'failure';
      if (axios.isAxiosError(err)) {
        errorMessage = err.message;
        responseBody = err.response?.data as
          | Record<string, unknown>
          | undefined;
        this.logger.error(
          `oauth: HTTP ${err.response?.status ?? 'ERR'} ${err.config?.url ?? ''}`,
          JSON.stringify(err.response?.data).slice(0, 2000),
        );
      } else if (err instanceof Error) {
        errorMessage = err.message;
        this.logger.error(`oauth: ${err.message}`);
      }
    }

    const latencyMs = Date.now() - start;
    if (status === 'success') {
      this.logger.log(`oauth: success | ${latencyMs}ms`);
    } else {
      this.logger.error(`oauth: failure | ${latencyMs}ms | ${errorMessage}`);
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
      serviceName: 'OAuth',
      probeType: 'oauth',
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
      .where({ name: 'OAuth' })
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
      probe_type: 'oauth',
      status,
      latency_ms: latencyMs,
      error_message: errorMessage,
      response_body: responseBody ? JSON.stringify(responseBody) : null,
    });
  }
}
