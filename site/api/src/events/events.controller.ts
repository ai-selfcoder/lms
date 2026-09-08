import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from './events.service';
import { SyncEventsDto } from './dto/sync-events.dto';

type RequestWithUser = { user: { id: string } };

@Controller('me/events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post()
  sync(@Req() req: RequestWithUser, @Body() dto: SyncEventsDto) {
    return this.events.sync(req.user.id, dto);
  }
}
