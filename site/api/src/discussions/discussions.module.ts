import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { SolutionNotesController } from './solution-notes.controller';
import { SolutionNotesService } from './solution-notes.service';
import { TaskPassesController } from './task-passes.controller';

@Module({
  imports: [AuthModule],
  controllers: [DiscussionsController, SolutionNotesController, TaskPassesController],
  providers: [DiscussionsService, SolutionNotesService],
})
export class DiscussionsModule {}
