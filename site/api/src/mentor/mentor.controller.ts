import { Body, Controller, Get, HttpException, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

  @UseGuards(JwtAuthGuard)
  @Post('review')
  async review(
    @Req() req: { user: { id: string } },
    @Body() dto: ReviewDto,
    @Res({ passthrough: true }) response: { setHeader: (name: string, value: string) => void },
  ) {
    try {
      return await this.mentor.review(dto, req.user.id);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 429) {
        const body = error.getResponse();
        const retryAfter = typeof body === 'object' && body !== null && 'retryAfter' in body
          ? Number((body as { retryAfter?: unknown }).retryAfter)
          : 1;
        response.setHeader('Retry-After', String(Math.max(1, retryAfter || 1)));
      }
      throw error;
    }
  }
}
