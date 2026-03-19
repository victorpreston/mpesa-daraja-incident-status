import { Module } from '@nestjs/common';
import { PostgresModule } from '../postgres/postgres.module';
import { DiscordChannel } from './channels/discord.channel';
import { EmailChannel } from './channels/email.channel';
import { SlackChannel } from './channels/slack.channel';
import { WebhookChannel } from './channels/webhook.channel';
import { NotifierService } from './notifier.service';

@Module({
  imports: [PostgresModule],
  providers: [
    NotifierService,
    EmailChannel,
    SlackChannel,
    DiscordChannel,
    WebhookChannel,
  ],
})
export class NotifierModule {}
