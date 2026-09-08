import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';

@Module({
  imports: [AuthModule],
  controllers: [MentorController],
  providers: [MentorService],
})
export class MentorModule {}
