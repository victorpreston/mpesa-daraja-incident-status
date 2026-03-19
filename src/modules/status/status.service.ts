import { Injectable } from '@nestjs/common';
import { PostgresService } from '../postgres/postgres.service';
import { RedisService } from '../redis/redis.service';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class StatusService {
  constructor(
    private readonly postgres: PostgresService,
    private readonly redis: RedisService,
    private readonly incidents: IncidentsService,
  ) {}

  async getSummary(): Promise<Record<string, unknown>> {
    const cached = await this.redis.get('status:summary');
    if (cached) return JSON.parse(cached) as Record<string, unknown>;

    const services = await this.postgres.db('daraja.services').select('*');
    const scores = await this.postgres
      .db('daraja.aggregator_scores')
      .select('*');
    const active = await this.incidents.findAll({
      status: 'investigating',
    } as never);

    const summary = {
      updated_at: new Date().toISOString(),
      services: services.map((svc) => {
        const score = scores.find((s) => s.service_id === svc.id);
        const incident = active.find((i) => i.service_id === svc.id);
        return {
          id: svc.id,
          name: svc.name,
          status: svc.status,
          health_score: score?.health_score ?? 100,
          active_incident: incident ?? null,
        };
      }),
    };

    await this.redis.set('status:summary', JSON.stringify(summary), 30);
    return summary;
  }
}
