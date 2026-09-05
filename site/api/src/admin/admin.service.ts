import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    const active = await this.prisma.taskProgress.findMany({ where: { updatedAt: { gte: activeSince } }, distinct: ['userId'], select: { userId: true } });
    return {
      stats: { users, solved, activeUsers7d: active.length },
      users: recent.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
    };
  }
}
