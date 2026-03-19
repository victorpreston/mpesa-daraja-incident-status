import { Module } from '@nestjs/common';
import { PostgresModule } from '../postgres/postgres.module';
import { CallbackController } from './callback.controller';
import { CallbackService } from './callback.service';

@Module({
  imports: [PostgresModule],
  controllers: [CallbackController],
  providers: [CallbackService],
})
export class CallbackModule {}
