import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleAuthStartResult, GoogleExportService, GoogleTokenExchangeResult } from '../google/google-export.service';
import { CrmGoogleSettings } from '../storage/crm-store.types';
import { StorageService } from '../storage/storage.service';
import { UpdateGoogleSettingsDto } from './dto/update-google-settings.dto';

type GoogleSettingsResponse = {
  spreadsheet_id: string | null;
  folder_id: string | null;
  title_prefix: string | null;
  has_client_secret: boolean;
  has_oauth_token: boolean;
};

@Injectable()
export class GoogleSettingsService {
  constructor(
    private readonly storageService: StorageService,
    private readonly googleExportService: GoogleExportService,
  ) {}

  async getSettings(): Promise<GoogleSettingsResponse> {
    const store = await this.storageService.readStore();
    const settings = this.ensureGoogleSettingsShape(store.googleSettings);

    return this.toResponse(settings);
  }

  async updateSettings(dto: UpdateGoogleSettingsDto): Promise<GoogleSettingsResponse> {
    const nextStore = await this.storageService.updateStore((current) => {
      const currentSettings = this.ensureGoogleSettingsShape(current.googleSettings);

      const nextSettings: CrmGoogleSettings = {
        ...currentSettings,
        spreadsheet_id: this.normalizeNullableString(dto.spreadsheet_id, currentSettings.spreadsheet_id),
        folder_id: this.normalizeNullableString(dto.folder_id, currentSettings.folder_id),
        title_prefix: this.normalizeNullableString(dto.title_prefix, currentSettings.title_prefix),
      };

      return {
        ...current,
        googleSettings: nextSettings,
      };
    });

    return this.toResponse(this.ensureGoogleSettingsShape(nextStore.googleSettings));
  }

  async uploadClientSecret(file?: { buffer: Buffer }): Promise<{ ok: true; has_client_secret: true }> {
    if (!file) {
      throw new BadRequestException('client_secret file is required');
    }

    const raw = file.buffer.toString('utf-8');
    const parsed = this.parseJson(raw);
    this.validateGoogleClientSecretShape(parsed);

    await this.storageService.updateStore((current) => {
      const currentSettings = this.ensureGoogleSettingsShape(current.googleSettings);

      return {
        ...current,
        googleSettings: {
          ...currentSettings,
          client_secret_json: JSON.stringify(parsed),
          oauth_token_json: null,
        },
      };
    });

    return {
      ok: true,
      has_client_secret: true,
    };
  }

  async startOAuth(): Promise<GoogleAuthStartResult> {
    const store = await this.storageService.readStore();
    const settings = this.ensureGoogleSettingsShape(store.googleSettings);
    return this.googleExportService.createAuthUrl(settings);
  }

  async exchangeOAuthCode(code: string | null | undefined): Promise<GoogleTokenExchangeResult> {
    if (typeof code !== 'string' || code.trim().length === 0) {
      throw new BadRequestException('google oauth code is required');
    }

    const store = await this.storageService.readStore();
    const settings = this.ensureGoogleSettingsShape(store.googleSettings);
    const result = await this.googleExportService.exchangeCode(settings, code);

    await this.storageService.updateStore((current) => ({
      ...current,
      googleSettings: {
        ...this.ensureGoogleSettingsShape(current.googleSettings),
        oauth_token_json: result.tokenJson,
      },
    }));

    return {
      ok: true,
      has_oauth_token: true,
    };
  }

  private toResponse(settings: CrmGoogleSettings): GoogleSettingsResponse {
    return {
      spreadsheet_id: settings.spreadsheet_id,
      folder_id: settings.folder_id,
      title_prefix: settings.title_prefix,
      has_client_secret: settings.client_secret_json !== null,
      has_oauth_token: settings.oauth_token_json !== null,
    };
  }

  private ensureGoogleSettingsShape(settings: Partial<CrmGoogleSettings> | undefined): CrmGoogleSettings {
    return {
      spreadsheet_id: this.normalizeStoredNullableString(settings?.spreadsheet_id),
      folder_id: this.normalizeStoredNullableString(settings?.folder_id),
      title_prefix: this.normalizeStoredNullableString(settings?.title_prefix),
      client_secret_json: this.normalizeStoredNullableString(settings?.client_secret_json),
      oauth_token_json: this.normalizeStoredNullableString(settings?.oauth_token_json),
    };
  }

  private normalizeStoredNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeNullableString(input: string | null | undefined, fallback: string | null): string | null {
    if (input === undefined) {
      return fallback;
    }

    if (input === null) {
      return null;
    }

    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException('client_secret file must be valid JSON');
    }
  }

  private validateGoogleClientSecretShape(value: unknown): void {
    if (!this.isRecord(value)) {
      throw new BadRequestException('client_secret JSON must be an object');
    }

    const oauthConfig = this.isRecord(value.installed)
      ? value.installed
      : this.isRecord(value.web)
        ? value.web
        : null;

    if (!oauthConfig) {
      throw new BadRequestException('client_secret JSON must include installed or web object');
    }

    const clientId = oauthConfig.client_id;
    const clientSecret = oauthConfig.client_secret;

    if (typeof clientId !== 'string' || clientId.trim().length === 0) {
      throw new BadRequestException('client_secret JSON must include non-empty client_id');
    }

    if (typeof clientSecret !== 'string' || clientSecret.trim().length === 0) {
      throw new BadRequestException('client_secret JSON must include non-empty client_secret');
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
