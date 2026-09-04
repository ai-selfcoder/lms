import { Body, Controller, Get, Post } from '@nestjs/common';
import { MentorService } from './mentor.service';
import { ReviewDto } from './dto/review.dto';

@Controller('mentor')
export class MentorController {
  constructor(private readonly mentor: MentorService) {}

  // Доступность фичи (чтобы фронт мог скрыть кнопку, если ключ не задан).
  @Get('status')
  status() {
    return { configured: this.mentor.configured };
  }

  @Post('review')
  review(@Body() dto: ReviewDto) {
    return this.mentor.review(dto);
  }
}
