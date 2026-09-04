import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtPayload { sub: string; email: string; }

function cookieExtractor(req: Request): string | null {
  const match = (req.headers.cookie ?? '').split(';').map((part) => part.trim()).find((part) => part.startsWith('goroutine.session='));
  return match ? decodeURIComponent(match.slice('goroutine.session='.length)) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me-dev-secret'),
    });
  }
  async validate(payload: JwtPayload) { return { id: payload.sub, email: payload.email }; }
}

export { cookieExtractor };
