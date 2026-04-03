import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SendContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
