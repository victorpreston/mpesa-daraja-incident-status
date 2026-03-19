import { Module } from '@nestjs/common';
import { PostgresModule } from '../postgres/postgres.module';
import { AggregatorService } from './aggregator.service';

@Module({
  imports: [PostgresModule],
  providers: [AggregatorService],
})
export class AggregatorModule {}
