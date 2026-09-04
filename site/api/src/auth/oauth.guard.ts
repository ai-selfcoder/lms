import {
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Wraps AuthGuard(provider) but, when the provider's credentials are not
// configured, throws 501 instead of blowing up on an unknown passport strategy.
function makeOAuthGuard(provider: 'github' | 'google', label: string) {
  @Injectable()
  class OAuthGuard extends AuthGuard(provider) {
    private get configured(): boolean {
      const key = provider.toUpperCase();
      return Boolean(
        process.env[`${key}_CLIENT_ID`] && process.env[`${key}_CLIENT_SECRET`],
      );
    }

    canActivate(context: ExecutionContext) {
      if (!this.configured) {
        throw new NotImplementedException(`${label} OAuth не настроен`);
      }
      return super.canActivate(context);
    }
  }
  return OAuthGuard;
}

export const GitHubAuthGuard = makeOAuthGuard('github', 'GitHub');
export const GoogleAuthGuard = makeOAuthGuard('google', 'Google');
