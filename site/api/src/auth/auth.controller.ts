import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GitHubAuthGuard, GoogleAuthGuard } from './oauth.guard';
import { OAuthUser } from './github.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  private cookieOptions() {
    return { httpOnly: true, secure: this.config.get('NODE_ENV') === 'production', sameSite: 'lax' as const, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto);
    res.cookie('goroutine.session', result.accessToken, this.cookieOptions());
    res.cookie('goroutine.csrf', result.csrfToken, { httpOnly: false, secure: this.config.get('NODE_ENV') === 'production', sameSite: 'lax' as const, maxAge: this.cookieOptions().maxAge, path: '/' });
    return { user: result.user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    res.cookie('goroutine.session', result.accessToken, this.cookieOptions());
    res.cookie('goroutine.csrf', result.csrfToken, { httpOnly: false, secure: this.config.get('NODE_ENV') === 'production', sameSite: 'lax' as const, maxAge: this.cookieOptions().maxAge, path: '/' });
    return { user: result.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { id: string; email: string } }) { return this.auth.me(req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) { res.clearCookie('goroutine.session', { path: '/' }); res.clearCookie('goroutine.csrf', { path: '/' }); return { ok: true }; }

  @UseGuards(GitHubAuthGuard)
  @Get('github') github() {}
  @UseGuards(GitHubAuthGuard)
  @Get('github/callback') githubCallback(@Req() req: { user: OAuthUser }, @Res() res: Response) { return this.handleCallback(req.user, res); }
  @UseGuards(GoogleAuthGuard)
  @Get('google') google() {}
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback') googleCallback(@Req() req: { user: OAuthUser }, @Res() res: Response) { return this.handleCallback(req.user, res); }

  private async handleCallback(oauthUser: OAuthUser, res: Response) {
    const webOrigin = this.config.get<string>('WEB_ORIGIN', 'http://localhost:3000');
    try {
      const user = await this.auth.validateOAuthLogin({ provider: oauthUser.provider, providerId: oauthUser.providerId, email: oauthUser.email });
      const token = this.auth.signToken(user);
      res.cookie('goroutine.session', token, this.cookieOptions());
      res.cookie('goroutine.csrf', this.auth.csrfToken(), { httpOnly: false, secure: this.config.get('NODE_ENV') === 'production', sameSite: 'lax' as const, maxAge: this.cookieOptions().maxAge, path: '/' });
      res.redirect(`${webOrigin}/auth/callback`);
    } catch { res.redirect(`${webOrigin}/auth/callback?error=oauth_failed`); }
  }
}
