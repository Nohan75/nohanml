import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { Profile } from './profile.entity';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get profile' })
  get(): Promise<Profile> {
    return this.profileService.get();
  }

  @Post()
  @ApiOperation({ summary: 'Create or replace profile' })
  upsert(@Body() dto: CreateProfileDto): Promise<Profile> {
    return this.profileService.upsert(dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update profile' })
  update(@Body() dto: UpdateProfileDto): Promise<Profile> {
    return this.profileService.update(dto);
  }
}
