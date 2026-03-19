import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackChannel {
  private readonly logger = new Logger(SlackChannel.name);

  async send(webhookUrl: string, text: string): Promise<void> {
    await axios.post(webhookUrl, { text }, { timeout: 10000 });
    this.logger.log('Slack notification sent');
  }
}
