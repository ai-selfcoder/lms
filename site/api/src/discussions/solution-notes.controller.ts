import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSolutionNoteDto } from './dto/create-solution-note.dto';
import { SolutionNotesService } from './solution-notes.service';

type AuthenticatedRequest = { user: { id: string } };

@UseGuards(JwtAuthGuard)
@Controller('me/tasks/:taskId/solution-notes')
export class SolutionNotesController {
  constructor(private readonly notes: SolutionNotesService) {}

  @Get()
  list(@Param('taskId') taskId: string, @Req() req: AuthenticatedRequest) {
    return this.notes.list(taskId, req.user.id);
  }

  @Post()
  create(@Param('taskId') taskId: string, @Req() req: AuthenticatedRequest, @Body() dto: CreateSolutionNoteDto) {
    return this.notes.create(taskId, req.user.id, dto);
  }
}
