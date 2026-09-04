import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

function readCookie(request: { headers: { cookie?: string } }, name: string): string | undefined {
  return request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use((req: { method: string; path: string; headers: { cookie?: string; 'x-csrf-token'?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }, next: () => void) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.path.startsWith('/me/')) {
      const expected = readCookie(req, 'goroutine.csrf');
      if (!expected || expected !== req.headers['x-csrf-token']) { res.status(403).json({ message: 'Invalid CSRF token' }); return; }
    }
    next();
  });
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true });
  const prisma = app.get(PrismaService);
  prisma.enableShutdownHooks(app);
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`goroutine-api listening on http://localhost:${port}`);
}
bootstrap();

// Session JWTs are issued as HttpOnly cookies by AuthController.
// The readable double-submit cookie is checked above for progress mutations.

export { readCookie };

void readCookie;
