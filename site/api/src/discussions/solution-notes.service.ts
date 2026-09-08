import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolutionNoteDto } from './dto/create-solution-note.dto';

function aliasFor(userId: string) {
  return `Решивший #${userId.slice(-5).toUpperCase()}`;
}

function normalizeTaskId(taskId: string) {
  const value = decodeURIComponent(taskId).trim();
  if (!/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(value) || value.length > 120) {
    throw new BadRequestException('Invalid task id');
  }
  return value;
}

function normalizeBody(body: string) {
  const value = body.trim().replace(/\r\n/g, '\n');
  // Notes are explanations, not a second way to publish an answer. Block the
  // clear code forms while allowing normal engineering terminology.
  if (/```|~~~|^\s*(package\s+\w+|func\s+\w+|import\s*[.(]|type\s+\w+\s+(struct|interface)|[\w.]+\s*:=)/m.test(value)) {
    throw new BadRequestException('Solution notes must not contain source code');
  }
  return value;
}

@Injectable()
export class SolutionNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(taskId: string, userId: string) {
    const normalized = normalizeTaskId(taskId);
    await this.requirePassed(normalized, userId);
    const notes = await this.prisma.taskSolutionNote.findMany({
      where: { taskId: normalized },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: { id: true, taskId: true, body: true, createdAt: true, user: { select: { id: true } } },
    });
    return notes.map((note) => ({ id: note.id, taskId: note.taskId, body: note.body, createdAt: note.createdAt, author: aliasFor(note.user.id) }));
  }

  async create(taskId: string, userId: string, dto: CreateSolutionNoteDto) {
    const normalized = normalizeTaskId(taskId);
    await this.requirePassed(normalized, userId);
    const body = normalizeBody(dto.body);
    const note = await this.prisma.taskSolutionNote.upsert({
      where: { taskId_userId: { taskId: normalized, userId } },
      create: { taskId: normalized, userId, body },
      update: { body },
      select: { id: true, taskId: true, body: true, createdAt: true, user: { select: { id: true } } },
    });
    return { id: note.id, taskId: note.taskId, body: note.body, createdAt: note.createdAt, author: aliasFor(note.user.id) };
  }

  async recordPass(taskId: string, userId: string) {
    const normalized = normalizeTaskId(taskId);
    return this.prisma.taskPass.upsert({
      where: { userId_taskId: { userId, taskId: normalized } },
      create: { userId, taskId: normalized },
      update: {},
      select: { taskId: true, passedAt: true },
    });
  }

  private async requirePassed(taskId: string, userId: string) {
    const passed = await this.prisma.taskPass.findUnique({
      where: { userId_taskId: { userId, taskId } },
      select: { id: true },
    });
    if (!passed) {
      throw new ForbiddenException('Solution notes open after a confirmed PASS for this task');
    }
  }
}
