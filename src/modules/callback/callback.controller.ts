import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CallbackService } from './callback.service';

@ApiTags('callbacks')
@Controller('daraja')
export class CallbackController {
  constructor(private readonly callbackService: CallbackService) {}

  @Post('callback')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Daraja M-Pesa callback',
    description:
      'Receives STK Push and B2C result callbacks from Safaricom. Publishes events to Kafka for aggregation.',
  })
  @ApiBody({
    description: 'Safaricom M-Pesa callback payload (STK Push or B2C Result)',
    schema: {
      type: 'object',
      example: {
        Body: {
          stkCallback: {
            MerchantRequestID: '29115-34620561-1',
            CheckoutRequestID: 'ws_CO_191220191020363925',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Callback accepted.',
    schema: { type: 'object', properties: { ResultCode: { type: 'number', example: 0 } } },
  })
  async handleCallback(
    @Body() body: Record<string, unknown>,
  ): Promise<{ ResultCode: number }> {
    await this.callbackService.handle(body);
    return { ResultCode: 0 };
  }
}
