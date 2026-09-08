import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { DiscussionsService } from './discussions.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller()
export class DiscussionsController {
  constructor(private readonly discussions: DiscussionsService) {}

  @Get('tasks/:taskId/comments')
  list(@Param('taskId') taskId: string) {
    return this.discussions.list(taskId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCommentDto,
  ) {
    return this.discussions.create(taskId, req.user.id, dto);
  }
}
