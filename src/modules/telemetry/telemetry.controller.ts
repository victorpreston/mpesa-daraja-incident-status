import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportTelemetryDto } from './dto/report-telemetry.dto';
import { TelemetryService } from './telemetry.service';

@ApiTags('telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({
    summary: 'Report a Daraja API failure',
    description:
      'Accepts anonymous failure reports from apps using the daraja-monitor-sdk. Reports are stored and fed into the aggregator pipeline to enrich health scores with real production signal.',
  })
  @ApiBody({ type: ReportTelemetryDto })
  @ApiResponse({ status: 202, description: 'Report accepted.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async report(@Body() dto: ReportTelemetryDto): Promise<void> {
    await this.telemetryService.report(dto);
  }
}
