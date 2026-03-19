import { Injectable } from '@nestjs/common';
import { PostgresService } from '../postgres/postgres.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { Subscriber } from './subscriber.entity';

@Injectable()
export class SubscribersService {
  constructor(private readonly postgres: PostgresService) {}

  async create(dto: CreateSubscriberDto): Promise<Subscriber> {
    const [row] = await this.postgres
      .db('daraja.subscribers')
      .insert({
        email: dto.email,
        slack_webhook_url: dto.slack_webhook_url,
        discord_webhook_url: dto.discord_webhook_url,
        custom_webhook_url: dto.custom_webhook_url,
        browser_token: dto.browser_token,
        subscribed_services: dto.subscribed_services
          ? JSON.stringify(dto.subscribed_services)
          : JSON.stringify([]),
      })
      .returning('*');
    return row as Subscriber;
  }

  async findOne(id: string): Promise<Subscriber | null> {
    const row = await this.postgres
      .db('daraja.subscribers')
      .where({ id })
      .first();
    return (row as Subscriber) ?? null;
  }

  async deactivate(id: string): Promise<void> {
    await this.postgres
      .db('daraja.subscribers')
      .where({ id })
      .update({ is_active: false });
  }
}
