import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../kafka/kafka.service';
import { PostgresService } from '../postgres/postgres.service';
import { AccountBalanceProbe } from './account-balance.probe';
import { B2cProbe } from './b2c.probe';
import { C2bPaybillProbe } from './c2b-paybill.probe';
import { OauthProbe } from './oauth.probe';
import { ReversalProbe } from './reversal.probe';
import { StkPushProbe } from './stk-push.probe';
import { TransactionStatusProbe } from './transaction-status.probe';

export interface ProbeRunner {
  run(): Promise<void>;
}

@Injectable()
export class ProbesScheduler implements OnModuleInit {
  private readonly logger = new Logger(ProbesScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly postgres: PostgresService,
    private readonly kafka: KafkaService,
    private readonly stkPush: StkPushProbe,
    private readonly oauth: OauthProbe,
    private readonly c2b: C2bPaybillProbe,
    private readonly b2c: B2cProbe,
    private readonly accountBalance: AccountBalanceProbe,
    private readonly transactionStatus: TransactionStatusProbe,
    private readonly reversal: ReversalProbe,
  ) {}

  onModuleInit() {
    const enabled = this.config.get<string>('PROBE_ENABLED') !== 'false';
    if (!enabled) return;

    const delay = this.config.get<number>('PROBE_START_DELAY_MS') ?? 5000;
    const interval =
      (this.config.get<number>('PROBE_INTERVAL_SECONDS') ?? 30) * 1000;

    setTimeout(() => {
      void this.runAll();
      setInterval(() => void this.runAll(), interval);
    }, delay);
  }

  private async runAll(): Promise<void> {
    const probes: ProbeRunner[] = [
      this.stkPush,
      this.oauth,
      this.c2b,
      this.b2c,
      this.accountBalance,
      this.transactionStatus,
      this.reversal,
    ];

    await Promise.allSettled(
      probes.map((p) =>
        p
          .run()
          .catch((err: unknown) => this.logger.error('Probe run error', err)),
      ),
    );
  }
}
