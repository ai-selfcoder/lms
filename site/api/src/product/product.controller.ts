import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductService } from './product.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller()
export class ProductController {
  constructor(private readonly product: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/entitlements')
  entitlements(@Req() req: AuthenticatedRequest) { return this.product.entitlements(req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Put('me/career-goal')
  setGoal(@Req() req: AuthenticatedRequest, @Body() body: { goal?: string }) { return this.product.setGoal(req.user.id, body.goal ?? ''); }

  @UseGuards(JwtAuthGuard)
  @Get('me/reports/latest')
  latest(@Req() req: AuthenticatedRequest) { return this.product.latestReport(req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Post('me/reports')
  create(@Req() req: AuthenticatedRequest, @Body() body: { title?: string; goal?: string; skills?: unknown[] }) {
    return this.product.createReport(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/reports/:id/share')
  share(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { isPublic?: boolean }) {
    return this.product.shareReport(req.user.id, id, body.isPublic !== false);
  }

  @Get('reports/share/:token')
  shared(@Param('token') token: string) { return this.product.sharedReport(token); }
}
