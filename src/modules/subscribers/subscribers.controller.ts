import {
  Body,
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { SubscribersService } from './subscribers.service';

@ApiTags('subscribers')
@Controller('subscribe')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create subscriber',
    description:
      'Registers a new subscriber to receive incident alerts via email, Slack, Discord, or custom webhook.',
  })
  @ApiResponse({ status: 201, description: 'Subscriber created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Body() dto: CreateSubscriberDto) {
    return this.subscribersService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Unsubscribe',
    description: 'Deactivates a subscriber so they no longer receive alerts.',
  })
  @ApiParam({ name: 'id', description: 'Subscriber UUID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Subscriber deactivated.' })
  @ApiNotFoundResponse({ description: 'Subscriber not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const existing = await this.subscribersService.findOne(id);
    if (!existing) throw new NotFoundException('Subscriber not found');
    await this.subscribersService.deactivate(id);
  }
}
