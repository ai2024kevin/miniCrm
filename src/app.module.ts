import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { DealsModule } from './deals/deals.module';
import { GoogleSettingsModule } from './google-settings/google-settings.module';
import { HealthController } from './health/health.controller';
import { ReportsModule } from './reports/reports.module';
import { StorageModule } from './storage/storage.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ClientsModule,
    DealsModule,
    GoogleSettingsModule,
    ReportsModule,
    StorageModule,
    TasksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
