import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const resolvePort = (): number => {
  const argPortIndex = process.argv.indexOf('--port');
  if (argPortIndex >= 0 && process.argv[argPortIndex + 1]) {
    const parsed = Number(process.argv[argPortIndex + 1]);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const envPort = Number(process.env.PORT ?? '3000');
  return Number.isNaN(envPort) ? 3000 : envPort;
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const port = resolvePort();
  await app.listen(port);
}

void bootstrap();
