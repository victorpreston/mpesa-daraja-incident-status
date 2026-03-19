import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  findAll(@Query() query: QueryIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.incidentsService.findWithUpdates(id);
    if (!result) throw new NotFoundException('Incident not found');
    return result;
  }
}
