import { Module } from '@nestjs/common';
import { PostgresModule } from '../postgres/postgres.module';
import { HistoryService } from './history.service';

@Module({
  imports: [PostgresModule],
  providers: [HistoryService],
})
export class HistoryModule {}
