import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';

type OAuthClientSecretShape = {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
};

type GoogleSettingsCredentials = {
  client_secret_json: string | null;
  oauth_token_json: string | null;
};

type GoogleSheetPayload = {
  title: string;
  sheetTitle: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
};

type GoogleExportTarget = {
  spreadsheetId: string | null;
  folderId: string | null;
};

type GoogleAuthStartResult = {
  auth_url: string;
};

type GoogleTokenExchangeResult = {
  ok: true;
  has_oauth_token: true;
};

type GoogleSpreadsheetResult = {
  spreadsheetId: string;
  spreadsheetUrl: string;
};

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

@Injectable()
export class GoogleExportService {
  createAuthUrl(settings: GoogleSettingsCredentials): GoogleAuthStartResult {
    const client = this.createOAuthClient(settings.client_secret_json);

    return {
      auth_url: client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [...GOOGLE_SCOPES],
      }),
    };
  }

  async exchangeCode(settings: GoogleSettingsCredentials, code: string): Promise<GoogleTokenExchangeResult & { tokenJson: string }> {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      throw new BadRequestException('google oauth code is required');
    }

    const client = this.createOAuthClient(settings.client_secret_json);

    try {
      const { tokens } = await client.getToken(trimmedCode);

      if (!tokens.access_token && !tokens.refresh_token) {
        throw new BadRequestException('google oauth token response is empty');
      }

      return {
        ok: true,
        has_oauth_token: true,
        tokenJson: JSON.stringify(tokens),
      };
    } catch (error) {
      throw this.toGoogleException(error, 'Не удалось завершить подключение Google OAuth.');
    }
  }

  async exportSheet(
    settings: GoogleSettingsCredentials,
    target: GoogleExportTarget,
    payload: GoogleSheetPayload,
  ): Promise<GoogleSpreadsheetResult> {
    if (target.spreadsheetId) {
      return this.exportToExistingSpreadsheet(settings, target.spreadsheetId, payload);
    }

    if (target.folderId) {
      return this.exportToNewSpreadsheet(settings, target.folderId, payload);
    }

    throw new BadRequestException('spreadsheet_id or folder_id is required');
  }

  private async exportToExistingSpreadsheet(
    settings: GoogleSettingsCredentials,
    spreadsheetId: string,
    payload: GoogleSheetPayload,
  ): Promise<GoogleSpreadsheetResult> {
    const auth = this.createAuthorizedClient(settings);
    const sheetsApi = google.sheets({ version: 'v4', auth });

    try {
      const spreadsheet = await sheetsApi.spreadsheets.get({ spreadsheetId });
      const sheetTitle = payload.sheetTitle;
      const existingSheet = spreadsheet.data.sheets?.find((sheet) => sheet.properties?.title === sheetTitle);

      if (!existingSheet) {
        await sheetsApi.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetTitle },
                },
              },
            ],
          },
        });
      }

      await sheetsApi.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetTitle}!A:ZZ`,
      });

      await sheetsApi.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [payload.headers, ...payload.rows],
        },
      });

      return {
        spreadsheetId,
        spreadsheetUrl: this.buildSpreadsheetUrl(spreadsheetId, existingSheet ? sheetTitle : undefined),
      };
    } catch (error) {
      throw this.toGoogleException(error, 'Не удалось обновить Google Sheets таблицу.');
    }
  }

  private async exportToNewSpreadsheet(
    settings: GoogleSettingsCredentials,
    folderId: string,
    payload: GoogleSheetPayload,
  ): Promise<GoogleSpreadsheetResult> {
    const auth = this.createAuthorizedClient(settings);
    const sheetsApi = google.sheets({ version: 'v4', auth });
    const driveApi = google.drive({ version: 'v3', auth });

    try {
      const created = await sheetsApi.spreadsheets.create({
        requestBody: {
          properties: { title: payload.title },
          sheets: [
            {
              properties: { title: payload.sheetTitle },
            },
          ],
        },
      });

      const spreadsheetId = created.data.spreadsheetId;
      if (!spreadsheetId) {
        throw new InternalServerErrorException('Google spreadsheet was created without id');
      }

      await sheetsApi.spreadsheets.values.update({
        spreadsheetId,
        range: `${payload.sheetTitle}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [payload.headers, ...payload.rows],
        },
      });

      await driveApi.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        fields: 'id, parents',
      });

      return {
        spreadsheetId,
        spreadsheetUrl: this.buildSpreadsheetUrl(spreadsheetId),
      };
    } catch (error) {
      throw this.toGoogleException(error, 'Не удалось создать Google Sheets таблицу.');
    }
  }

  private createAuthorizedClient(settings: GoogleSettingsCredentials) {
    if (!settings.oauth_token_json) {
      throw new BadRequestException('google oauth token is not configured');
    }

    const client = this.createOAuthClient(settings.client_secret_json);
    client.setCredentials(this.parseCredentials(settings.oauth_token_json));
    return client;
  }

  private createOAuthClient(clientSecretJson: string | null) {
    if (!clientSecretJson) {
      throw new BadRequestException('google client secret is not configured');
    }

    const parsed = this.parseJson(clientSecretJson, 'google client secret must be valid JSON');
    const oauthConfig = this.pickOAuthConfig(parsed);

    return new google.auth.OAuth2(
      oauthConfig.client_id,
      oauthConfig.client_secret,
      oauthConfig.redirect_uris?.[0] ?? 'urn:ietf:wg:oauth:2.0:oob',
    );
  }

  private pickOAuthConfig(value: unknown): OAuthClientSecretShape {
    if (!this.isRecord(value)) {
      throw new BadRequestException('google client secret must be an object');
    }

    const rawConfig = this.isRecord(value.installed)
      ? value.installed
      : this.isRecord(value.web)
        ? value.web
        : null;

    if (!rawConfig) {
      throw new BadRequestException('google client secret must include installed or web object');
    }

    const client_id = typeof rawConfig.client_id === 'string' ? rawConfig.client_id.trim() : '';
    const client_secret = typeof rawConfig.client_secret === 'string' ? rawConfig.client_secret.trim() : '';
    const redirect_uris = Array.isArray(rawConfig.redirect_uris)
      ? rawConfig.redirect_uris.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : undefined;

    if (!client_id || !client_secret) {
      throw new BadRequestException('google client secret must include non-empty client_id and client_secret');
    }

    return { client_id, client_secret, redirect_uris };
  }

  private parseJson(value: string, message: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException(message);
    }
  }

  private parseCredentials(value: string): Record<string, unknown> {
    const parsed = this.parseJson(value, 'google oauth token must be valid JSON');

    if (!this.isRecord(parsed)) {
      throw new BadRequestException('google oauth token must be an object');
    }

    return parsed;
  }

  private buildSpreadsheetUrl(spreadsheetId: string, gidTitle?: string): string {
    const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return gidTitle ? `${baseUrl}#gid=0&sheet=${encodeURIComponent(gidTitle)}` : baseUrl;
  }

  private toGoogleException(error: unknown, message: string) {
    if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
      return error;
    }

    return new BadRequestException(message);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

export type { GoogleAuthStartResult, GoogleSheetPayload, GoogleSpreadsheetResult, GoogleTokenExchangeResult };
