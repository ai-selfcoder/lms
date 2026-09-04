import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({ data: { email: dto.email, passwordHash, level: dto.level } });
    return this.sign(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.sign(user);
  }

  async validateOAuthLogin(input: { provider: string; providerId: string; email: string }) {
    let user = await this.prisma.user.findUnique({ where: { provider_providerId: { provider: input.provider, providerId: input.providerId } } });
    if (user) return user;
    if (input.email) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: input.email } });
      if (byEmail) return this.prisma.user.update({ where: { id: byEmail.id }, data: { provider: input.provider, providerId: input.providerId } });
    }
    return this.prisma.user.create({ data: { email: input.email, provider: input.provider, providerId: input.providerId, passwordHash: null, level: null } });
  }

  signToken(user: { id: string; email: string }) { return this.jwt.sign({ sub: user.id, email: user.email }); }
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, level: true } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
  csrfToken() { return randomBytes(32).toString('hex'); }

  private sign(user: { id: string; email: string; level: string | null }) {
    return { accessToken: this.signToken(user), csrfToken: this.csrfToken(), user: { id: user.id, email: user.email, level: user.level } };
  }
}
