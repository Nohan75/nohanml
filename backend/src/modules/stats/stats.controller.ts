import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService, PortfolioStats } from './stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get portfolio stats (admin)' })
  getStats(): Promise<PortfolioStats> {
    return this.statsService.getStats();
  }
}
