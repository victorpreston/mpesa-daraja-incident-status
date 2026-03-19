import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { RedisService } from '../redis/redis.service';
import { IncidentCreatedEvent } from '../kafka/events/incident-created.event';
import { IncidentResolvedEvent } from '../kafka/events/incident-resolved.event';
import { ProbeResultEvent } from '../kafka/events/probe-result.event';
import { TOPICS } from '../kafka/topics';
import {
  FAILURE_THRESHOLD,
  computeHealthScore,
  determineSeverity,
} from './aggregator.rules';

@Injectable()
export class AggregatorService implements OnModuleInit {
  private readonly logger = new Logger(AggregatorService.name);
  private readonly failureWindows = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    const group =
      this.config.get<string>('KAFKA_CONSUMER_GROUP') ?? 'aggregator';
    await this.kafka.subscribe(
      `${group}-aggregator`,
      TOPICS.PROBE_RESULT,
      async (payload) => {
        await this.handleProbeResult(payload as ProbeResultEvent);
      },
    );
    await this.kafka.subscribe(
      `${group}-aggregator-callbacks`,
      TOPICS.PROBE_CALLBACKS,
      async (payload) => {
        await this.handleProbeResult(payload as ProbeResultEvent);
      },
    );
  }

  private async handleProbeResult(event: ProbeResultEvent): Promise<void> {
    if (!event.serviceId) return;

    const failures = this.failureWindows.get(event.serviceId) ?? 0;
    const updatedFailures = event.status === 'failure' ? failures + 1 : 0;
    this.failureWindows.set(event.serviceId, updatedFailures);

    await this.upsertAggregatorScore(event, updatedFailures);

    const existingIncident = await this.postgres
      .db('daraja.incidents')
      .where({ service_id: event.serviceId })
      .whereIn('status', ['investigating', 'identified', 'monitoring'])
      .first();

    if (updatedFailures >= FAILURE_THRESHOLD && !existingIncident) {
      await this.openIncident(event, updatedFailures);
    } else if (updatedFailures === 0 && existingIncident) {
      await this.resolveIncident(existingIncident as Record<string, unknown>);
    }
  }

  private async upsertAggregatorScore(
    event: ProbeResultEvent,
    failureCount: number,
  ): Promise<void> {
    const existing = await this.postgres
      .db('daraja.aggregator_scores')
      .where({ service_id: event.serviceId })
      .first();

    const successCount = existing
      ? (existing.success_count as number) +
        (event.status === 'success' ? 1 : 0)
      : event.status === 'success'
        ? 1
        : 0;

    const totalFailures = existing
      ? (existing.failure_count as number) +
        (event.status === 'failure' ? 1 : 0)
      : event.status === 'failure'
        ? 1
        : 0;

    const healthScore = computeHealthScore(successCount, totalFailures);

    if (existing) {
      await this.postgres
        .db('daraja.aggregator_scores')
        .where({ service_id: event.serviceId })
        .update({
          health_score: healthScore,
          failure_count: totalFailures,
          success_count: successCount,
          updated_at: new Date(),
        });
    } else {
      await this.postgres.db('daraja.aggregator_scores').insert({
        service_id: event.serviceId,
        health_score: healthScore,
        failure_count: totalFailures,
        success_count: successCount,
      });
    }
  }

  private async openIncident(
    event: ProbeResultEvent,
    failureCount: number,
  ): Promise<void> {
    const severity = determineSeverity(computeHealthScore(0, failureCount));

    const [incident] = await this.postgres
      .db('daraja.incidents')
      .insert({
        service_id: event.serviceId,
        title: `${event.serviceName} is experiencing issues`,
        description: event.errorMessage ?? 'Synthetic probe failures detected',
        status: 'investigating',
        severity,
        started_at: new Date(),
      })
      .returning('*');

    await this.postgres
      .db('daraja.services')
      .where({ id: event.serviceId })
      .update({
        status:
          severity === 'critical' ? 'major_outage' : 'degraded_performance',
      });

    const incidentRecord = incident as Record<string, unknown>;

    this.logger.warn(
      `Incident opened for ${event.serviceName}: ${String(incidentRecord['id'])}`,
    );

    const incidentPayload: IncidentCreatedEvent = {
      incidentId: String(incidentRecord['id']),
      serviceId: event.serviceId,
      serviceName: event.serviceName,
      title: String(incidentRecord['title']),
      severity,
      status: 'investigating',
      startedAt: new Date().toISOString(),
    };

    await this.kafka.publish<IncidentCreatedEvent>(
      TOPICS.INCIDENT_CREATED,
      incidentPayload,
    );
    await this.redis.publish(
      TOPICS.INCIDENT_CREATED,
      JSON.stringify(incidentPayload),
    );
  }

  private async resolveIncident(
    incident: Record<string, unknown>,
  ): Promise<void> {
    await this.postgres
      .db('daraja.incidents')
      .where({ id: incident['id'] })
      .update({ status: 'resolved', resolved_at: new Date() });

    await this.postgres
      .db('daraja.services')
      .where({ id: incident['service_id'] })
      .update({ status: 'operational' });

    this.logger.log(`Incident resolved: ${String(incident['id'])}`);

    const resolvedPayload: IncidentResolvedEvent = {
      incidentId: String(incident['id']),
      serviceId: String(incident['service_id']),
      serviceName: '',
      resolvedAt: new Date().toISOString(),
    };

    await this.kafka.publish<IncidentResolvedEvent>(
      TOPICS.INCIDENT_RESOLVED,
      resolvedPayload,
    );
    await this.redis.publish(
      TOPICS.INCIDENT_RESOLVED,
      JSON.stringify(resolvedPayload),
    );
  }
}
