import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  get(@Query('courseId') courseId?: string) {
    return this.leaderboard.get(courseId?.trim() || undefined);
  }
}
