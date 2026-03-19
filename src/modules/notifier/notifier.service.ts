import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { IncidentCreatedEvent } from '../kafka/events/incident-created.event';
import { IncidentResolvedEvent } from '../kafka/events/incident-resolved.event';
import { TOPICS } from '../kafka/topics';
import { DiscordChannel } from './channels/discord.channel';
import { EmailChannel } from './channels/email.channel';
import { SlackChannel } from './channels/slack.channel';
import { WebhookChannel } from './channels/webhook.channel';

@Injectable()
export class NotifierService implements OnModuleInit {
  private readonly logger = new Logger(NotifierService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
    private readonly email: EmailChannel,
    private readonly slack: SlackChannel,
    private readonly discord: DiscordChannel,
    private readonly webhook: WebhookChannel,
  ) {}

  async onModuleInit() {
    const group = this.config.get<string>('KAFKA_CONSUMER_GROUP') ?? 'notifier';

    await this.kafka.subscribe(
      `${group}-notifier-created`,
      TOPICS.INCIDENT_CREATED,
      async (payload) => {
        await this.handleIncidentCreated(payload as IncidentCreatedEvent);
      },
    );

    await this.kafka.subscribe(
      `${group}-notifier-resolved`,
      TOPICS.INCIDENT_RESOLVED,
      async (payload) => {
        await this.handleIncidentResolved(payload as IncidentResolvedEvent);
      },
    );
  }

  private async handleIncidentCreated(
    event: IncidentCreatedEvent,
  ): Promise<void> {
    const subscribers = await this.getActiveSubscribers(event.serviceId);
    const subject = `[${event.severity.toUpperCase()}] ${event.title}`;
    const body = `Incident detected on ${event.serviceName}.\nStatus: ${event.status}\nStarted: ${event.startedAt}`;

    for (const sub of subscribers) {
      await this.dispatch(
        sub as Record<string, unknown>,
        event.incidentId,
        subject,
        body,
      );
    }
  }

  private async handleIncidentResolved(
    event: IncidentResolvedEvent,
  ): Promise<void> {
    const subscribers = await this.getActiveSubscribers(event.serviceId);
    const subject = `[RESOLVED] ${event.serviceId} incident resolved`;
    const body = `The incident on service ${event.serviceId} has been resolved.\nResolved at: ${event.resolvedAt}`;

    for (const sub of subscribers) {
      await this.dispatch(
        sub as Record<string, unknown>,
        event.incidentId,
        subject,
        body,
      );
    }
  }

  private async getActiveSubscribers(serviceId: string): Promise<unknown[]> {
    return this.postgres
      .db('daraja.subscribers')
      .where({ is_active: true })
      .whereRaw(
        '? = ANY(subscribed_services) OR array_length(subscribed_services, 1) IS NULL',
        [serviceId],
      );
  }

  private async dispatch(
    sub: Record<string, unknown>,
    incidentId: string,
    subject: string,
    body: string,
  ): Promise<void> {
    const channels: Array<{ channel: string; fn: () => Promise<void> }> = [];

    if (sub['email']) {
      channels.push({
        channel: 'email',
        fn: () =>
          this.email.send(String(sub['email']), subject, `<pre>${body}</pre>`),
      });
    }
    if (sub['slack_webhook_url']) {
      channels.push({
        channel: 'slack',
        fn: () =>
          this.slack.send(
            String(sub['slack_webhook_url']),
            `*${subject}*\n${body}`,
          ),
      });
    }
    if (sub['discord_webhook_url']) {
      channels.push({
        channel: 'discord',
        fn: () =>
          this.discord.send(
            String(sub['discord_webhook_url']),
            `**${subject}**\n${body}`,
          ),
      });
    }
    if (sub['custom_webhook_url']) {
      channels.push({
        channel: 'webhook',
        fn: () =>
          this.webhook.send(String(sub['custom_webhook_url']), {
            incidentId,
            subject,
            body,
          }),
      });
    }

    for (const { channel, fn } of channels) {
      let status = 'sent';
      let errorMessage: string | undefined;
      try {
        await fn();
      } catch (err: unknown) {
        status = 'failed';
        if (err instanceof Error) errorMessage = err.message;
        this.logger.error(`Notification failed [${channel}]: ${errorMessage}`);
      }
      await this.postgres.db('daraja.notifications').insert({
        incident_id: incidentId,
        subscriber_id: sub['id'],
        channel,
        status,
        sent_at: status === 'sent' ? new Date() : null,
        error_message: errorMessage,
      });
    }
  }
}
