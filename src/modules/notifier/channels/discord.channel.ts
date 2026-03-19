import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DiscordChannel {
  private readonly logger = new Logger(DiscordChannel.name);

  async send(webhookUrl: string, content: string): Promise<void> {
    await axios.post(webhookUrl, { content }, { timeout: 10000 });
    this.logger.log('Discord notification sent');
  }
}
