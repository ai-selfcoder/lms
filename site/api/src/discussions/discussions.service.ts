import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

function aliasFor(userId: string) {
  return `Участник #${userId.slice(-5).toUpperCase()}`;
}

function normalizeBody(body: string) {
  const value = body.trim().replace(/\r\n/g, '\n');
  if (/```|~~~|^\s*(package\s+\w+|func\s+\w+|import\s*[.(]|type\s+\w+\s+(struct|interface)|[\w.]+\s*:=)/m.test(value)) {
    throw new BadRequestException('Task discussions must not contain source code');
  }
  return value;
}

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(taskId: string) {
    const normalized = this.normalizeTaskId(taskId);
    const comments = await this.prisma.taskComment.findMany({
      where: { taskId: normalized },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        taskId: true,
        body: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });
    return comments.reverse().map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      body: comment.body,
      createdAt: comment.createdAt,
      author: aliasFor(comment.user.id),
    }));
  }

  async create(taskId: string, userId: string, dto: CreateCommentDto) {
    const normalized = this.normalizeTaskId(taskId);
    const comment = await this.prisma.taskComment.create({
      data: { taskId: normalized, userId, body: normalizeBody(dto.body) },
      select: {
        id: true,
        taskId: true,
        body: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });
    return {
      id: comment.id,
      taskId: comment.taskId,
      body: comment.body,
      createdAt: comment.createdAt,
      author: aliasFor(comment.user.id),
    };
  }

  private normalizeTaskId(taskId: string) {
    const value = decodeURIComponent(taskId).trim();
    if (!value || value.length > 120 || !/^[a-z0-9:_-]+$/i.test(value)) {
      throw new BadRequestException('Invalid task id');
    }
    return value;
  }
}
