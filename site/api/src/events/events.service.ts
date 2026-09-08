import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncEventsDto } from './dto/sync-events.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(userId: string, dto: SyncEventsDto) {
    const events = dto.events ?? [];
    if (!events.length) return { accepted: 0, received: 0 };

    const storageIds = events.map((event) => `${userId}:${event.id}`);
    const existing = await this.prisma.learningEvent.findMany({
      where: { id: { in: storageIds } },
      select: { id: true },
    });
    const seen = new Set(existing.map((event) => event.id));
    const pending = events.filter((event) => {
      const storageId = `${userId}:${event.id}`;
      if (seen.has(storageId)) return false;
      seen.add(storageId);
      return true;
    });

    // SQLite has no createMany/skipDuplicates support in Prisma. Insert one
    // event at a time and treat a concurrent unique-key race as an already
    // accepted event. This keeps the endpoint idempotent even when a browser
    // retries the same batch while the first request is still in flight.
    let accepted = 0;
    for (const event of pending) {
      try {
        await this.prisma.learningEvent.create({
          data: {
            id: `${userId}:${event.id}`,
            userId,
            type: event.type,
            itemId: event.itemId,
            courseId: event.courseId,
            occurredAt: new Date(event.at),
            metaJson: event.meta ? JSON.stringify(event.meta) : undefined,
          },
        });
        accepted += 1;
      } catch (error) {
        if (!this.isUniqueError(error)) throw error;
      }
    }

    return { accepted, received: events.length };
  }

  private isUniqueError(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error
      && (error as { code?: string }).code === 'P2002';
  }
}
