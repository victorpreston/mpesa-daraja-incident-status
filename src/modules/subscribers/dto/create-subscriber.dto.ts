import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriberDto {
  @ApiPropertyOptional({
    description: 'Email address to send incident alerts to',
    example: 'ops@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Slack incoming webhook URL',
    example: 'https://hooks.slack.com/services/T000/B000/xxxx',
  })
  @IsOptional()
  @IsUrl()
  slack_webhook_url?: string;

  @ApiPropertyOptional({
    description: 'Discord webhook URL',
    example: 'https://discord.com/api/webhooks/000/xxxx',
  })
  @IsOptional()
  @IsUrl()
  discord_webhook_url?: string;

  @ApiPropertyOptional({
    description: 'Custom webhook URL that receives JSON POST payloads',
    example: 'https://your-domain.com/hooks/incidents',
  })
  @IsOptional()
  @IsUrl()
  custom_webhook_url?: string;

  @ApiPropertyOptional({
    description: 'Browser push notification token',
    example: 'ABC123...',
  })
  @IsOptional()
  @IsString()
  browser_token?: string;

  @ApiPropertyOptional({
    description:
      'List of service UUIDs to subscribe to. Leave empty to subscribe to all services.',
    type: [String],
    example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subscribed_services?: string[];
}
