import { Module } from '@nestjs/common';
import { IncidentsModule } from '../incidents/incidents.module';
import { PostgresModule } from '../postgres/postgres.module';
import { StatusController } from './status.controller';
import { StatusGateway } from './status.gateway';
import { StatusService } from './status.service';

@Module({
  imports: [PostgresModule, IncidentsModule],
  controllers: [StatusController],
  providers: [StatusService, StatusGateway],
})
export class StatusModule {}
