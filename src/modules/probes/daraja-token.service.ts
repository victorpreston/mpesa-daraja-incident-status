import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DarajaTokenService {
  private readonly logger = new Logger(DarajaTokenService.name);
  private cached: { token: string; expiresAt: number } | null = null;
  private inflight: Promise<string> | null = null;

  constructor(private readonly config: ConfigService) {}

  async getToken(): Promise<string> {
    if (this.cached && Date.now() < this.cached.expiresAt) {
      return this.cached.token;
    }
    if (!this.inflight) {
      this.inflight = this.fetchToken().finally(() => {
        this.inflight = null;
      });
    }
    return this.inflight;
  }

  private async fetchToken(): Promise<string> {
    const key = this.config.get<string>('DARAJA_CONSUMER_KEY')!;
    const secret = this.config.get<string>('DARAJA_CONSUMER_SECRET')!;
    const url = this.config.get<string>('DARAJA_AUTH_URL')!;
    const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

    this.logger.log(`Fetching OAuth token from ${url}`);

    const res = await axios.get<{ access_token: string; expires_in: string }>(
      url,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/json',
        },
        timeout: 10000,
      },
    );

    if (typeof res.data?.access_token !== 'string') {
      throw new Error(
        `Unexpected OAuth response: ${JSON.stringify(res.data).slice(0, 500)}`,
      );
    }

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
    };
  }
}
