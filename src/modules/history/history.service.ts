import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { TOPICS } from '../kafka/topics';

@Injectable()
export class HistoryService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
  ) {}

  async onModuleInit() {
    const group = this.config.get<string>('KAFKA_CONSUMER_GROUP') ?? 'history';

    const entries: Array<{
      topic: string;
      groupSuffix: string;
      eventType: string;
    }> = [
      {
        topic: TOPICS.PROBE_RESULT,
        groupSuffix: 'history-probe-result',
        eventType: 'probe.result',
      },
      {
        topic: TOPICS.PROBE_CALLBACKS,
        groupSuffix: 'history-probe-callbacks',
        eventType: 'probe.callback',
      },
      {
        topic: TOPICS.INCIDENT_CREATED,
        groupSuffix: 'history-incident-created',
        eventType: 'incident.created',
      },
      {
        topic: TOPICS.INCIDENT_RESOLVED,
        groupSuffix: 'history-incident-resolved',
        eventType: 'incident.resolved',
      },
    ];

    for (const entry of entries) {
      await this.kafka.subscribe(
        `${group}-${entry.groupSuffix}`,
        entry.topic,
        async (payload) => {
          await this.persist(entry.topic, entry.eventType, payload);
        },
      );
    }
  }

  private async persist(
    topic: string,
    eventType: string,
    payload: unknown,
  ): Promise<void> {
    await this.postgres.db('daraja.event_log').insert({
      topic,
      event_type: eventType,
      payload: JSON.stringify(payload),
    });
  }
}
