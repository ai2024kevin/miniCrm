import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GoogleExportService } from '../google/google-export.service';
import { GoogleSettingsController } from './google-settings.controller';
import { GoogleSettingsService } from './google-settings.service';

@Module({
  imports: [AuthModule],
  controllers: [GoogleSettingsController],
  providers: [GoogleSettingsService, GoogleExportService],
  exports: [GoogleSettingsService, GoogleExportService],
})
export class GoogleSettingsModule {}
