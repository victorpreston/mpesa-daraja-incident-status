export interface IncidentCreatedEvent {
  incidentId: string;
  serviceId: string;
  serviceName: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
}
