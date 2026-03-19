export interface IncidentResolvedEvent {
  incidentId: string;
  serviceId: string;
  serviceName: string;
  resolvedAt: string;
}
