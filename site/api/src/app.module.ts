import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProgressModule } from './progress/progress.module';
import { MentorModule } from './mentor/mentor.module';
import { AdminModule } from './admin/admin.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { EventsModule } from './events/events.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProgressModule,
    MentorModule,
    AdminModule,
    DiscussionsModule,
    EventsModule,
    LeaderboardModule,
    TeamsModule,
  ],
})
export class AppModule {}
