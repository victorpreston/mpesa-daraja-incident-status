import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'List incidents', description: 'Returns all incidents, optionally filtered by service, status, or severity. Ordered by start time descending.' })
  @ApiQuery({ name: 'serviceId', required: false, description: 'Filter by service UUID' })
  @ApiQuery({ name: 'status', required: false, enum: ['investigating', 'identified', 'monitoring', 'resolved'], description: 'Filter by incident status' })
  @ApiQuery({ name: 'severity', required: false, enum: ['minor', 'major', 'critical'], description: 'Filter by incident severity' })
  @ApiResponse({ status: 200, description: 'Array of incidents.' })
  findAll(@Query() query: QueryIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident detail', description: 'Returns a single incident along with its timeline updates.' })
  @ApiParam({ name: 'id', description: 'Incident UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Incident with updates.' })
  @ApiNotFoundResponse({ description: 'Incident not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.incidentsService.findWithUpdates(id);
    if (!result) throw new NotFoundException('Incident not found');
    return result;
  }
}
