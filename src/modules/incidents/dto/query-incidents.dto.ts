import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryIncidentsDto {
  @ApiPropertyOptional({ description: 'Filter by service UUID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Filter by incident status',
    enum: ['investigating', 'identified', 'monitoring', 'resolved'],
  })
  @IsOptional()
  @IsIn(['investigating', 'identified', 'monitoring', 'resolved'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by incident severity',
    enum: ['minor', 'major', 'critical'],
  })
  @IsOptional()
  @IsIn(['minor', 'major', 'critical'])
  severity?: string;
}
