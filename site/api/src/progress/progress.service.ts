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

    // Older clients stored Go task ids without a course prefix. Collapse those
    // rows into the canonical `go:<id>` key so sync never leaks duplicates.
    const merged = new Map<string, { solved: boolean; solvedAt: Date; code?: string; canonical: boolean }>();
    for (const r of rows) {
      const taskId = this.normalizeTaskId(r.taskId);
      const canonical = r.taskId === taskId;
      const existing = merged.get(taskId);
      if (!existing) {
        merged.set(taskId, { solved: r.solved, solvedAt: r.solvedAt, ...(r.code != null ? { code: r.code } : {}), canonical });
        continue;
      }
      existing.solved = existing.solved || r.solved;
      if (r.solvedAt < existing.solvedAt) existing.solvedAt = r.solvedAt;
      // Prefer code from the canonical row; otherwise retain the newest row's code.
      if (r.code != null && (!existing.canonical || canonical)) existing.code = r.code;
      existing.canonical = existing.canonical || canonical;
    }

    const solved: string[] = [];
    const solvedAt: Record<string, string> = {};
    const code: Record<string, string> = {};
    for (const [taskId, value] of merged) {
      if (value.solved) solved.push(taskId);
      solvedAt[taskId] = value.solvedAt.toISOString();
      if (value.code != null) code[taskId] = value.code;
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

    // Task completion is append-only. A delayed device must never erase a
    // verified local completion, and a draft-only request must not imply PASS.
    await this.prisma.$transaction(async (tx) => {
      for (const rawTaskId of taskIds) {
        const taskId = this.normalizeTaskId(rawTaskId);
        const incomingSolved = solvedSet.has(rawTaskId) || solvedSet.has(taskId);
        const incomingSolvedAt = incomingSolved
          ? this.validDate(dto.solvedAt?.[rawTaskId] ?? dto.solvedAt?.[taskId])
          : undefined;
        const incomingCode = dto.code?.[rawTaskId] ?? dto.code?.[taskId];
        const current = await this.findCurrent(tx, userId, taskId);

        if (!current) {
          await tx.taskProgress.create({
            data: {
              userId,
              taskId,
              solved: incomingSolved,
              ...(incomingSolved && incomingSolvedAt ? { solvedAt: incomingSolvedAt } : {}),
              ...(incomingCode !== undefined ? { code: incomingCode } : {}),
            },
          });
          continue;
        }

        const solved = current.solved || incomingSolved;
        const solvedAt = incomingSolvedAt && incomingSolvedAt < current.solvedAt
          ? incomingSolvedAt
          : current.solvedAt;
        await tx.taskProgress.update({
          where: { userId_taskId: { userId, taskId: current.taskId } },
          data: {
            solved,
            ...(solved && solvedAt.getTime() !== current.solvedAt.getTime() ? { solvedAt } : {}),
            ...(incomingCode !== undefined ? { code: incomingCode } : {}),
          },
        });
      }
    });

    return this.get(userId);
  }

  async upsertTask(userId: string, taskId: string, dto: UpsertTaskDto) {
    const canonicalTaskId = this.normalizeTaskId(taskId);
    const current = await this.findCurrent(this.prisma, userId, canonicalTaskId);
    const solved = current?.solved || dto.solved === true;
    if (!current) {
      await this.prisma.taskProgress.create({ data: { userId, taskId: canonicalTaskId, solved, ...(dto.code !== undefined ? { code: dto.code } : {}) } });
    } else {
      await this.prisma.taskProgress.update({
        where: { userId_taskId: { userId, taskId: current.taskId } },
        data: { solved, ...(dto.code !== undefined ? { code: dto.code } : {}) },
      });
    }
    return this.get(userId);
  }

  private normalizeTaskId(taskId: string): string {
    return taskId.includes(':') ? taskId : `go:${taskId}`;
  }

  private async findCurrent(client: Pick<PrismaService, 'taskProgress'>, userId: string, taskId: string) {
    const canonical = await client.taskProgress.findUnique({ where: { userId_taskId: { userId, taskId } } });
    if (canonical || !taskId.startsWith('go:')) return canonical;
    // Keep using a pre-platform raw Go row when it already exists; get() will
    // expose it under the canonical key until a data migration is run.
    return client.taskProgress.findUnique({ where: { userId_taskId: { userId, taskId: taskId.slice(3) } } });
  }

  private validDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
}
