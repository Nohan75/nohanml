import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { Profile } from './profile.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('profile')
@Controller('profile')
export class ProfilePublicController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get profile' })
  get(): Promise<Profile> {
    return this.profileService.get();
  }
}

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/profile')
export class ProfileAdminController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create or replace profile (admin)' })
  upsert(@Body() dto: CreateProfileDto): Promise<Profile> {
    return this.profileService.upsert(dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update profile (admin)' })
  update(@Body() dto: UpdateProfileDto): Promise<Profile> {
    return this.profileService.update(dto);
  }
}
