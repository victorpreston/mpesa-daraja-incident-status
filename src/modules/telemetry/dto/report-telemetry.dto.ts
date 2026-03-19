import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportTelemetryDto {
  @ApiProperty({
    description: 'The Daraja endpoint that failed',
    enum: [
      'stk-push',
      'oauth',
      'c2b',
      'b2c',
      'account-balance',
      'transaction-status',
      'reversal',
    ],
    example: 'stk-push',
  })
  @IsString()
  @IsIn([
    'stk-push',
    'oauth',
    'c2b',
    'b2c',
    'account-balance',
    'transaction-status',
    'reversal',
  ])
  endpoint: string;

  @ApiPropertyOptional({
    description:
      'HTTP status code returned (omit for timeouts / network errors)',
    example: 503,
  })
  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @ApiProperty({
    description: 'Request duration in milliseconds',
    example: 15032,
  })
  @IsNumber()
  latencyMs: number;

  @ApiProperty({
    description: 'Category of failure',
    enum: ['timeout', 'http_error', 'network_error', 'auth_error'],
    example: 'timeout',
  })
  @IsString()
  @IsIn(['timeout', 'http_error', 'network_error', 'auth_error'])
  errorType: string;

  @ApiPropertyOptional({
    description: 'daraja-monitor-sdk version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  sdkVersion?: string;

  @ApiPropertyOptional({
    description: 'Daraja environment the caller is using',
    enum: ['sandbox', 'production'],
    example: 'production',
  })
  @IsOptional()
  @IsString()
  @IsIn(['sandbox', 'production'])
  environment?: string;
}
