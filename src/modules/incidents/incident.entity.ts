export interface Incident {
  id: string;
  service_id: string;
  title: string;
  description?: string;
  status: string;
  severity: string;
  started_at: Date;
  resolved_at?: Date;
  impact?: string;
  created_at: Date;
  updated_at: Date;
}
