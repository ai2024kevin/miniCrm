import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PersistenceModule } from './persistence/persistence.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AiModule,
    PrismaModule,
    PersistenceModule,
    TelegramModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
