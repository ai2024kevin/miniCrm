import { Body, Controller, Get, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import { UpdateGoogleSettingsDto } from './dto/update-google-settings.dto';
import { GoogleSettingsService } from './google-settings.service';

type ExchangeGoogleOAuthDto = {
  code: string;
};

@Controller('settings/google')
@UseGuards(BearerTokenGuard)
export class GoogleSettingsController {
  constructor(private readonly googleSettingsService: GoogleSettingsService) {}

  @Get()
  getSettings() {
    return this.googleSettingsService.getSettings();
  }

  @Put()
  updateSettings(@Body() dto: UpdateGoogleSettingsDto) {
    return this.googleSettingsService.updateSettings(dto);
  }

  @Post('client-secret')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 64 * 1024 } }))
  uploadClientSecret(@UploadedFile() file?: { buffer: Buffer }) {
    return this.googleSettingsService.uploadClientSecret(file);
  }

  @Get('oauth/start')
  startOAuth() {
    return this.googleSettingsService.startOAuth();
  }

  @Post('oauth/exchange')
  exchangeOAuth(@Body() dto: ExchangeGoogleOAuthDto) {
    return this.googleSettingsService.exchangeOAuthCode(dto.code);
  }
}
