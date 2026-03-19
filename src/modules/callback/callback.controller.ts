import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CallbackService } from './callback.service';

@Controller('daraja')
export class CallbackController {
  constructor(private readonly callbackService: CallbackService) {}

  @Post('callback')
  @HttpCode(200)
  async handleCallback(
    @Body() body: Record<string, unknown>,
  ): Promise<{ ResultCode: number }> {
    await this.callbackService.handle(body);
    return { ResultCode: 0 };
  }
}
