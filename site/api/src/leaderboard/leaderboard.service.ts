import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntry {
  rank: number;
  alias: string;
  feedback: number;
  passed: number;
  passRate: number;
  solvedTasks: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(courseId?: string) {
    const events = await this.prisma.learningEvent.findMany({
      where: courseId ? { courseId } : undefined,
      select: { userId: true, type: true, itemId: true },
    });
    const byUser = new Map<string, { passed: number; failed: number; solved: Set<string> }>();
    for (const event of events) {
      if (event.type !== 'passed' && event.type !== 'failed') continue;
      const stats = byUser.get(event.userId) ?? { passed: 0, failed: 0, solved: new Set<string>() };
      if (event.type === 'passed') {
        stats.passed += 1;
        stats.solved.add(event.itemId);
      } else {
        stats.failed += 1;
      }
      byUser.set(event.userId, stats);
    }

    const ranked = [...byUser.entries()]
      .map(([userId, stats]) => {
        const feedback = stats.passed + stats.failed;
        return { userId, ...stats, feedback, passRate: feedback ? stats.passed / feedback : 0 };
      })
      .filter((entry) => entry.feedback >= 3)
      .sort((a, b) => b.passRate - a.passRate || b.solved.size - a.solved.size || b.feedback - a.feedback)
      .slice(0, 50);

    return {
      participants: ranked.length,
      entries: ranked.map((entry, index): LeaderboardEntry => ({
        rank: index + 1,
        alias: this.alias(entry.userId),
        feedback: entry.feedback,
        passed: entry.passed,
        passRate: Math.round(entry.passRate * 100),
        solvedTasks: entry.solved.size,
      })),
    };
  }

  private alias(userId: string) {
    const digest = createHash('sha256').update(`graphlms-leaderboard:${userId}`).digest('hex').slice(0, 6).toUpperCase();
    return `Инженер ${digest}`;
  }
}
