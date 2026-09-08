import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecordTaskPassDto } from './dto/record-task-pass.dto';
import { SolutionNotesService } from './solution-notes.service';

type AuthenticatedRequest = { user: { id: string } };

function proofIsValid(proof: string, taskId: string, secret: string) {
  const [payload, signature, extra] = proof.split('.');
  if (!payload || !signature || extra || !secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { taskId?: unknown; exp?: unknown };
    return decoded.taskId === taskId && typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

@UseGuards(JwtAuthGuard)
@Controller('me/task-passes')
export class TaskPassesController {
  constructor(private readonly config: ConfigService, private readonly notes: SolutionNotesService) {}

  @Post()
  record(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordTaskPassDto,
  ) {
    const expected = this.config.get<string>('GRADER_SYNC_SECRET', '');
    if (!proofIsValid(dto.proof, dto.taskId, expected)) throw new ForbiddenException('Trusted grader confirmation required');
    return this.notes.recordPass(dto.taskId, req.user.id);
  }
}
