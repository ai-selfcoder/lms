import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProgressService } from './progress.service';
import { SyncProgressDto, UpsertTaskDto } from './dto/sync-progress.dto';

type Req = { user: { id: string } };

@UseGuards(JwtAuthGuard)
@Controller('me/progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  get(@Req() req: Req) {
    return this.progress.get(req.user.id);
  }

  @Put()
  sync(@Req() req: Req, @Body() dto: SyncProgressDto) {
    return this.progress.sync(req.user.id, dto);
  }

  @Put(':taskId')
  upsertTask(
    @Req() req: Req,
    @Param('taskId') taskId: string,
    @Body() dto: UpsertTaskDto,
  ) {
    return this.progress.upsertTask(req.user.id, taskId, dto);
  }
}
