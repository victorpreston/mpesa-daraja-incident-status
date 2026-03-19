import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateSubscriberDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  slack_webhook_url?: string;

  @IsOptional()
  @IsUrl()
  discord_webhook_url?: string;

  @IsOptional()
  @IsUrl()
  custom_webhook_url?: string;

  @IsOptional()
  @IsString()
  browser_token?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subscribed_services?: string[];
}
