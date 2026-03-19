import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private client: Knex;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = knex({
      client: 'pg',
      connection: {
        host: this.config.get<string>('DATABASE_HOST'),
        port: this.config.get<number>('DATABASE_PORT'),
        user: this.config.get<string>('DATABASE_USER'),
        password: this.config.get<string>('DATABASE_PASSWORD'),
        database: this.config.get<string>('DATABASE_NAME'),
      },
      pool: { min: 2, max: 10 },
    });
  }

  async onModuleDestroy() {
    await this.client.destroy();
  }

  get db(): Knex {
    return this.client;
  }
}
