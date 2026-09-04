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
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { id: string; email: string } }) {
    return this.auth.me(req.user.id);
  }

  // --- GitHub OAuth ---

  @UseGuards(GitHubAuthGuard)
  @Get('github')
  github() {
    // Guard triggers the redirect to GitHub (or 501 if unconfigured).
  }

  @UseGuards(GitHubAuthGuard)
  @Get('github/callback')
  githubCallback(@Req() req: { user: OAuthUser }, @Res() res: Response) {
    return this.handleCallback(req.user, res);
  }

  // --- Google OAuth ---

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  google() {
    // Guard triggers the redirect to Google (or 501 if unconfigured).
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: { user: OAuthUser }, @Res() res: Response) {
    return this.handleCallback(req.user, res);
  }

  private async handleCallback(oauthUser: OAuthUser, res: Response) {
    const webOrigin = this.config.get<string>(
      'WEB_ORIGIN',
      'http://localhost:3000',
    );
    try {
      const user = await this.auth.validateOAuthLogin({
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
        email: oauthUser.email,
      });
      const token = this.auth.signToken(user);
      return res.redirect(`${webOrigin}/auth/callback?token=${token}`);
    } catch {
      return res.redirect(`${webOrigin}/auth/callback?error=oauth_failed`);
    }
  }
}
