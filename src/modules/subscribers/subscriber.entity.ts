export interface Subscriber {
  id: string;
  email?: string;
  slack_webhook_url?: string;
  discord_webhook_url?: string;
  custom_webhook_url?: string;
  browser_token?: string;
  subscribed_services: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
