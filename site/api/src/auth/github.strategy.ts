import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

export interface OAuthUser {
  provider: string;
  providerId: string;
  email: string;
  displayName?: string;
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    const apiUrl = config.get<string>('API_URL', 'http://localhost:4000');
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${apiUrl}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  // Whatever is returned here becomes req.user.
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<OAuthUser> {
    const email = profile.emails?.[0]?.value ?? `${profile.username}@github.local`;
    return {
      provider: 'github',
      providerId: profile.id,
      email,
      displayName: profile.displayName ?? profile.username,
    };
  }
}
