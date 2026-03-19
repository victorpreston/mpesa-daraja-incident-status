import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DarajaTokenService {
  private readonly logger = new Logger(DarajaTokenService.name);
  private cached: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  async getToken(): Promise<string> {
    if (this.cached && Date.now() < this.cached.expiresAt) {
      return this.cached.token;
    }

    const key = this.config.get<string>('DARAJA_CONSUMER_KEY')!;
    const secret = this.config.get<string>('DARAJA_CONSUMER_SECRET')!;
    const url = this.config.get<string>('DARAJA_AUTH_URL')!;
    const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

    const res = await axios.get<{ access_token: string; expires_in: string }>(
      url,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/json',
          'User-Agent': 'daraja-status-monitor/1.0',
        },
        timeout: 10000,
      },
    );

    const expiresIn = parseInt(res.data.expires_in ?? '3599', 10);
    this.cached = {
      token: res.data.access_token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000,
    };

    this.logger.log('OAuth token refreshed');
    return this.cached.token;
  }

  headers(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'daraja-status-monitor/1.0',
    };
  }
}
