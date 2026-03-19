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
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { SubscribersService } from './subscribers.service';

@Controller('subscribe')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  create(@Body() dto: CreateSubscriberDto) {
    return this.subscribersService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const existing = await this.subscribersService.findOne(id);
    if (!existing) throw new NotFoundException('Subscriber not found');
    await this.subscribersService.deactivate(id);
  }
}
