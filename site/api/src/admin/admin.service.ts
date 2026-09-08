import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { deriveTaskQuality, type QualityEventType } from './task-quality';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [users, solved, recent] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.taskProgress.count({ where: { solved: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, email: true, level: true, createdAt: true, _count: { select: { progress: true } } },
      }),
    ]);
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const qualitySince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [active, progressed, recentSolved, recentEvents, meaningfulUsers, qualityEvents] = await Promise.all([
      this.prisma.taskProgress.findMany({ where: { updatedAt: { gte: activeSince } }, distinct: ['userId'], select: { userId: true } }),
      this.prisma.taskProgress.findMany({ distinct: ['userId'], select: { userId: true } }),
      this.prisma.taskProgress.count({ where: { solved: true, solvedAt: { gte: activeSince } } }),
      this.prisma.learningEvent.count({ where: { occurredAt: { gte: activeSince } } }),
      this.prisma.learningEvent.findMany({ where: { occurredAt: { gte: activeSince }, type: 'completed' }, distinct: ['userId'], select: { userId: true } }),
      this.prisma.learningEvent.findMany({
        where: { occurredAt: { gte: qualitySince }, type: { in: ['started', 'run', 'failed', 'passed', 'completed'] } },
        select: { userId: true, type: true, itemId: true, courseId: true, occurredAt: true },
      }),
    ]);
    const taskQuality = deriveTaskQuality(qualityEvents.map((event) => ({
      ...event,
      type: event.type as QualityEventType,
    })));
    return {
      stats: {
        users,
        solved,
        activeUsers7d: active.length,
        usersWithProgress: progressed.length,
        activationRate: users ? Math.round((progressed.length / users) * 100) : 0,
        averageSolvedPerActive: progressed.length ? Math.round((solved / progressed.length) * 10) / 10 : 0,
        solvedLast7d: recentSolved,
        learningEvents7d: recentEvents,
        meaningfulUsers7d: meaningfulUsers.length,
      },
      taskQuality: {
        windowDays: 30,
        feedback: taskQuality.reduce((total, item) => total + item.feedback, 0),
        failed: taskQuality.reduce((total, item) => total + item.failed, 0),
        recoveredUsers: taskQuality.reduce((total, item) => total + item.recoveredUsers, 0),
        items: taskQuality.slice(0, 8),
      },
      users: recent.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
    };
  }
}
