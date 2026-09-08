import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateTeamTrackDto } from './dto/create-team-track.dto';

const teamSummarySelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { members: true, tracks: true } },
} as const;

const teamDetailInclude = {
  members: {
    orderBy: { createdAt: 'asc' },
    select: { userId: true, role: true, createdAt: true, user: { select: { email: true } } },
  },
  tracks: {
    orderBy: { createdAt: 'asc' },
    include: { items: { orderBy: { position: 'asc' }, select: { id: true, taskId: true, position: true } } },
  },
} as const;

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, team: { select: teamSummarySelect } },
    });
    return memberships.map(({ role, team }) => ({ ...team, role }));
  }

  async create(userId: string, dto: CreateTeamDto) {
    const team = await this.prisma.team.create({
      data: { name: dto.name, ownerId: userId, members: { create: { userId, role: 'owner' } } },
      select: teamSummarySelect,
    });
    return { ...team, role: 'owner' };
  }

  async get(teamId: string, userId: string) {
    const membership = await this.requireMember(teamId, userId);
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, include: teamDetailInclude });
    if (!team) throw new NotFoundException('Команда не найдена');
    return {
      id: team.id,
      name: team.name,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      role: membership.role,
      members: team.members.map((member) => ({ userId: member.userId, email: member.user.email, role: member.role, createdAt: member.createdAt })),
      tracks: team.tracks.map((track) => ({ id: track.id, name: track.name, description: track.description, items: track.items })),
    };
  }

  async addMember(teamId: string, actorId: string, dto: AddTeamMemberDto) {
    await this.requireManager(teamId, actorId);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true, email: true } });
    if (!user) throw new NotFoundException('Пользователь с такой почтой ещё не зарегистрирован');
    try {
      const member = await this.prisma.teamMember.create({ data: { teamId, userId: user.id }, select: { userId: true, role: true, createdAt: true } });
      return { ...member, email: user.email };
    } catch (error) {
      if (this.isUniqueError(error)) throw new ConflictException('Этот пользователь уже в команде');
      throw error;
    }
  }

  async createTrack(teamId: string, actorId: string, dto: CreateTeamTrackDto) {
    await this.requireManager(teamId, actorId);
    return this.prisma.teamTrack.create({
      data: { teamId, name: dto.name, description: dto.description || null },
      select: { id: true, name: true, description: true, items: true },
    });
  }

  async importItems(teamId: string, trackId: string, actorId: string, taskIds: string[]) {
    await this.requireManager(teamId, actorId);
    const track = await this.prisma.teamTrack.findFirst({ where: { id: trackId, teamId }, select: { id: true } });
    if (!track) throw new NotFoundException('Трек не найден');
    const uniqueIds = [...new Set(taskIds.map((id) => id.trim()))];
    const [existing, last] = await Promise.all([
      this.prisma.teamTrackItem.findMany({ where: { trackId, taskId: { in: uniqueIds } }, select: { taskId: true } }),
      this.prisma.teamTrackItem.aggregate({ where: { trackId }, _max: { position: true } }),
    ]);
    const existingIds = new Set(existing.map((item) => item.taskId));
    const pending = uniqueIds.filter((id) => !existingIds.has(id));
    if (!pending.length) throw new ConflictException('Все выбранные задачи уже есть в треке');
    const start = (last._max.position ?? -1) + 1;
    await this.prisma.$transaction(pending.map((taskId, index) => this.prisma.teamTrackItem.create({
      data: { trackId, taskId, position: start + index },
    })));
    return this.get(teamId, actorId);
  }

  async removeItem(teamId: string, trackId: string, itemId: string, actorId: string) {
    await this.requireManager(teamId, actorId);
    const item = await this.prisma.teamTrackItem.findFirst({ where: { id: itemId, trackId, track: { teamId } }, select: { id: true } });
    if (!item) throw new NotFoundException('Элемент трека не найден');
    await this.prisma.teamTrackItem.delete({ where: { id: item.id } });
    return { ok: true };
  }

  async report(teamId: string, userId: string) {
    await this.requireMember(teamId, userId);
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { orderBy: { createdAt: 'asc' }, select: { userId: true, role: true, user: { select: { email: true } } } },
        tracks: { orderBy: { createdAt: 'asc' }, include: { items: { select: { taskId: true } } } },
      },
    });
    if (!team) throw new NotFoundException('Команда не найдена');
    const taskIds = [...new Set(team.tracks.flatMap((track) => track.items.map((item) => item.taskId)))];
    const userIds = team.members.map((member) => member.userId);
    const passes = taskIds.length ? await this.prisma.taskPass.findMany({
      where: { userId: { in: userIds }, taskId: { in: taskIds } },
      select: { userId: true, taskId: true, passedAt: true },
    }) : [];
    const passedByUser = new Map<string, Set<string>>();
    for (const pass of passes) {
      const set = passedByUser.get(pass.userId) ?? new Set<string>();
      set.add(pass.taskId);
      passedByUser.set(pass.userId, set);
    }
    return {
      team: { id: team.id, name: team.name },
      totalTasks: taskIds.length,
      members: team.members.map((member) => ({
        userId: member.userId,
        email: member.user.email,
        role: member.role,
        passed: passedByUser.get(member.userId)?.size ?? 0,
      })),
      tracks: team.tracks.map((track) => ({
        id: track.id,
        name: track.name,
        tasks: track.items.length,
        completed: team.members.reduce((total, member) => total + track.items.filter((item) => passedByUser.get(member.userId)?.has(item.taskId)).length, 0),
      })),
    };
  }

  private async requireMember(teamId: string, userId: string) {
    const member = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } }, select: { role: true } });
    if (!member) throw new ForbiddenException('Нет доступа к этой команде');
    return member;
  }

  private async requireManager(teamId: string, userId: string) {
    const member = await this.requireMember(teamId, userId);
    if (member.role !== 'owner') throw new ForbiddenException('Только владелец может изменять командный трек');
  }

  private isUniqueError(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
  }
}
