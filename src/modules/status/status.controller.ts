import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StatusService } from './status.service';

@ApiTags('status')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @ApiOperation({
    summary: 'Get system status',
    description:
      'Returns the current health score and operational status for every monitored Daraja service. Cached for 30 seconds in Redis.',
  })
  @ApiResponse({
    status: 200,
    description: 'System status summary.',
    schema: {
      type: 'object',
      properties: {
        updated_at: { type: 'string', format: 'date-time' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'STK Push' },
              status: { type: 'string', example: 'operational' },
              health_score: { type: 'number', example: 100 },
              active_incident: { type: 'object', nullable: true },
            },
          },
        },
      },
    },
  })
  getSummary() {
    return this.statusService.getSummary();
  }
}
