import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RequestWithUser = { user?: { email?: string } };

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const email = request.user?.email?.toLowerCase();
    const configured = this.config.get<string>('ADMIN_EMAILS', '');
    const allowed = configured.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (!email || !allowed.includes(email)) throw new ForbiddenException('Admin access required');
    return true;
  }
}
