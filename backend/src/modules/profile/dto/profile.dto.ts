import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  heroTitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  heroSubtitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  location: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  available: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  cvUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  githubUrl?: string;
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
