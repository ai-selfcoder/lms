import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateTeamTrackDto } from './dto/create-team-track.dto';
import { ImportTeamTrackItemsDto } from './dto/import-team-track-items.dto';
import { TeamsService } from './teams.service';

type AuthenticatedRequest = { user: { id: string } };

@UseGuards(JwtAuthGuard)
@Controller('me/teams')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) { return this.teams.list(req.user.id); }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTeamDto) { return this.teams.create(req.user.id, dto); }

  @Get(':teamId')
  get(@Param('teamId') teamId: string, @Req() req: AuthenticatedRequest) { return this.teams.get(teamId, req.user.id); }

  @Post(':teamId/members')
  addMember(@Param('teamId') teamId: string, @Req() req: AuthenticatedRequest, @Body() dto: AddTeamMemberDto) { return this.teams.addMember(teamId, req.user.id, dto); }

  @Post(':teamId/tracks')
  createTrack(@Param('teamId') teamId: string, @Req() req: AuthenticatedRequest, @Body() dto: CreateTeamTrackDto) { return this.teams.createTrack(teamId, req.user.id, dto); }

  @Post(':teamId/tracks/:trackId/items')
  importItems(@Param('teamId') teamId: string, @Param('trackId') trackId: string, @Req() req: AuthenticatedRequest, @Body() dto: ImportTeamTrackItemsDto) { return this.teams.importItems(teamId, trackId, req.user.id, dto.taskIds); }

  @Delete(':teamId/tracks/:trackId/items/:itemId')
  removeItem(@Param('teamId') teamId: string, @Param('trackId') trackId: string, @Param('itemId') itemId: string, @Req() req: AuthenticatedRequest) { return this.teams.removeItem(teamId, trackId, itemId, req.user.id); }

  @Get(':teamId/report')
  report(@Param('teamId') teamId: string, @Req() req: AuthenticatedRequest) { return this.teams.report(teamId, req.user.id); }
}
