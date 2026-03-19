import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WebhookChannel {
  private readonly logger = new Logger(WebhookChannel.name);

  async send(url: string, payload: Record<string, unknown>): Promise<void> {
    await axios.post(url, payload, { timeout: 10000 });
    this.logger.log(`Webhook sent to ${url}`);
  }
}
