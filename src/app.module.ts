import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AggregatorModule } from './modules/aggregator/aggregator.module';
import { CallbackModule } from './modules/callback/callback.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { NotifierModule } from './modules/notifier/notifier.module';
import { PostgresModule } from './modules/postgres/postgres.module';
import { ProbesModule } from './modules/probes/probes.module';
import { RedisModule } from './modules/redis/redis.module';
import { StatusModule } from './modules/status/status.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { HistoryModule } from './modules/history/history.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PostgresModule,
    RedisModule,
    KafkaModule,
    ProbesModule,
    CallbackModule,
    AggregatorModule,
    IncidentsModule,
    NotifierModule,
    SubscribersModule,
    StatusModule,
    HistoryModule,
    TelemetryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
