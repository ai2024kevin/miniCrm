import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleExportService } from '../google/google-export.service';
import { StorageService } from '../storage/storage.service';
import { buildReportResponse, buildReportSheetData, ReportResponse, ReportType } from './report-builder';

@Injectable()
export class ReportsService {
  constructor(
    private readonly storageService: StorageService,
    private readonly googleExportService: GoogleExportService,
  ) {}

  async build(type: ReportType): Promise<ReportResponse> {
    const store = await this.storageService.readStore();
    const settings = store.googleSettings;

    if (!settings.client_secret_json) {
      throw new BadRequestException('Для экспорта в Google загрузите OAuth client secret JSON в настройках.');
    }

    if (!settings.oauth_token_json) {
      throw new BadRequestException('Подключите Google OAuth в настройках перед экспортом.');
    }

    if (!settings.spreadsheet_id && !settings.folder_id) {
      throw new BadRequestException('Укажите Spreadsheet ID или Folder ID в настройках Google.');
    }

    const reportData = buildReportSheetData(type, {
      clients: store.clients,
      deals: store.deals,
      tasks: store.tasks,
      titlePrefix: settings.title_prefix,
    });

    const exportResult = await this.googleExportService.exportSheet(
      {
        client_secret_json: settings.client_secret_json,
        oauth_token_json: settings.oauth_token_json,
      },
      {
        spreadsheetId: settings.spreadsheet_id,
        folderId: settings.spreadsheet_id ? null : settings.folder_id,
      },
      reportData,
    );

    return buildReportResponse(reportData.title, exportResult.spreadsheetUrl);
  }
}
