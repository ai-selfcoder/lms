import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GitHubStrategy } from './github.strategy';
import { GoogleStrategy } from './google.strategy';

// Only register an OAuth strategy when its credentials are present, so the app
// boots fine without any OAuth config (email/password keeps working).
const oauthStrategies: Provider[] = [];
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  oauthStrategies.push(GitHubStrategy);
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthStrategies.push(GoogleStrategy);
}

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me-dev-secret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...oauthStrategies],
})
export class AuthModule {}
