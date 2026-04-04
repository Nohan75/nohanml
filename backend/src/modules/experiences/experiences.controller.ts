import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { Experience } from './experience.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('experiences')
@Controller('experiences')
export class ExperiencesPublicController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  @ApiOperation({ summary: 'List all experiences' })
  findAll(): Promise<Experience[]> {
    return this.experiencesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an experience by id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Experience> {
    return this.experiencesService.findOne(id);
  }
}

@ApiTags('experiences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/experiences')
export class ExperiencesAdminController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an experience (admin)' })
  create(@Body() dto: CreateExperienceDto): Promise<Experience> {
    return this.experiencesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an experience (admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExperienceDto,
  ): Promise<Experience> {
    return this.experiencesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an experience (admin)' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.experiencesService.remove(id);
  }
}
