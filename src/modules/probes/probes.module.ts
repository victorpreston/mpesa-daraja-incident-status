import { Module } from '@nestjs/common';
import { PostgresModule } from '../postgres/postgres.module';
import { AccountBalanceProbe } from './account-balance.probe';
import { B2cProbe } from './b2c.probe';
import { C2bPaybillProbe } from './c2b-paybill.probe';
import { OauthProbe } from './oauth.probe';
import { ProbesScheduler } from './probes.scheduler';
import { ReversalProbe } from './reversal.probe';
import { StkPushProbe } from './stk-push.probe';
import { TransactionStatusProbe } from './transaction-status.probe';

@Module({
  imports: [PostgresModule],
  providers: [
    ProbesScheduler,
    StkPushProbe,
    OauthProbe,
    C2bPaybillProbe,
    B2cProbe,
    AccountBalanceProbe,
    TransactionStatusProbe,
    ReversalProbe,
  ],
})
export class ProbesModule {}
