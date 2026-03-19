import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class QueryIncidentsDto {
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsIn(['investigating', 'identified', 'monitoring', 'resolved'])
  status?: string;

  @IsOptional()
  @IsIn(['minor', 'major', 'critical'])
  severity?: string;
}
