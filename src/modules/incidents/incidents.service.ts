import { Injectable } from '@nestjs/common';
import { PostgresService } from '../postgres/postgres.service';
import { Incident } from './incident.entity';
import { QueryIncidentsDto } from './dto/query-incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly postgres: PostgresService) {}

  async findAll(query: QueryIncidentsDto): Promise<Incident[]> {
    const builder = this.postgres
      .db('daraja.incidents')
      .orderBy('started_at', 'desc');
    if (query.serviceId) builder.where({ service_id: query.serviceId });
    if (query.status) builder.where({ status: query.status });
    if (query.severity) builder.where({ severity: query.severity });
    return builder as unknown as Incident[];
  }

  async findOne(id: string): Promise<Incident | null> {
    const row = await this.postgres
      .db('daraja.incidents')
      .where({ id })
      .first();
    return (row as Incident) ?? null;
  }

  async findWithUpdates(
    id: string,
  ): Promise<{ incident: Incident; updates: unknown[] } | null> {
    const incident = await this.findOne(id);
    if (!incident) return null;
    const updates = await this.postgres
      .db('daraja.incident_updates')
      .where({ incident_id: id })
      .orderBy('created_at', 'desc');
    return { incident, updates };
  }

  async findActiveByService(serviceId: string): Promise<Incident | null> {
    const row = await this.postgres
      .db('daraja.incidents')
      .where({ service_id: serviceId })
      .whereIn('status', ['investigating', 'identified', 'monitoring'])
      .first();
    return (row as Incident) ?? null;
  }
}
