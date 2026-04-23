import { Module } from '@nestjs/common';
import { GoogleSettingsModule } from '../google-settings/google-settings.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [GoogleSettingsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
