import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncProgressDto, UpsertTaskDto } from './dto/sync-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const rows = await this.prisma.taskProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'asc' },
    });

    const solved: string[] = [];
    const solvedAt: Record<string, string> = {};
    const code: Record<string, string> = {};

    for (const r of rows) {
      if (r.solved) solved.push(r.taskId);
      solvedAt[r.taskId] = r.solvedAt.toISOString();
      if (r.code != null) code[r.taskId] = r.code;
    }

    return { solved, solvedAt, code };
  }

  // Idempotent bulk merge: upsert one row per mentioned taskId.
  async sync(userId: string, dto: SyncProgressDto) {
    const taskIds = new Set<string>([
      ...(dto.solved ?? []),
      ...Object.keys(dto.solvedAt ?? {}),
      ...Object.keys(dto.code ?? {}),
    ]);
    const solvedSet = new Set(dto.solved ?? []);

    await this.prisma.$transaction(
      [...taskIds].map((taskId) => {
        const solved = dto.solved ? solvedSet.has(taskId) : true;
        const solvedAt = dto.solvedAt?.[taskId]
          ? new Date(dto.solvedAt[taskId])
          : undefined;
        const code = dto.code?.[taskId];

        return this.prisma.taskProgress.upsert({
          where: { userId_taskId: { userId, taskId } },
          create: { userId, taskId, solved, ...(solvedAt ? { solvedAt } : {}), code },
          update: {
            solved,
            ...(solvedAt ? { solvedAt } : {}),
            ...(code !== undefined ? { code } : {}),
          },
        });
      }),
    );

    return this.get(userId);
  }

  async upsertTask(userId: string, taskId: string, dto: UpsertTaskDto) {
    const solved = dto.solved ?? true;
    await this.prisma.taskProgress.upsert({
      where: { userId_taskId: { userId, taskId } },
      create: { userId, taskId, solved, code: dto.code },
      update: {
        solved,
        ...(dto.code !== undefined ? { code: dto.code } : {}),
      },
    });
    return this.get(userId);
  }
}
