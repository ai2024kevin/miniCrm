import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GoogleExportService } from '../src/google/google-export.service';
import { createEmptyCrmStore } from '../src/storage/crm-store.types';
import { StorageService } from '../src/storage/storage.service';

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let storageService: StorageService;
  let testDataDir: string;
  const googleExportServiceMock = {
    exportSheet: jest.fn(async (_settings, target, payload) => ({
      spreadsheetId: target.spreadsheetId ?? 'generated-sheet-id',
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${target.spreadsheetId ?? 'generated-sheet-id'}/edit`,
      payload,
    })),
  };

  beforeAll(async () => {
    testDataDir = mkdtempSync(join(tmpdir(), 'crm-reports-e2e-'));
    process.env.DATA_DIR = testDataDir;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleExportService)
      .useValue(googleExportServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: ['health'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    storageService = moduleRef.get(StorageService);

    await app.init();
  });

  afterAll(async () => {
    delete process.env.DATA_DIR;

    if (app) {
      await app.close();
    }

    if (testDataDir) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('POST /reports/{clients,deals,tasks} exports into separate sheets of one spreadsheet when spreadsheet_id is set', async () => {
    const now = new Date().toISOString();
    const seed = createEmptyCrmStore();
    seed.googleSettings.spreadsheet_id = 'existing-spreadsheet';
    seed.googleSettings.folder_id = 'folder-ignored';
    seed.googleSettings.title_prefix = 'CRM Export';
    seed.googleSettings.client_secret_json = JSON.stringify({
      installed: {
        client_id: 'abc.apps.googleusercontent.com',
        client_secret: 'secret-value',
      },
    });
    seed.googleSettings.oauth_token_json = JSON.stringify({ refresh_token: 'refresh-token' });
    seed.clients = [{
      id: 1,
      name: 'Client A',
      phone: null,
      email: null,
      company: null,
      status: 'active',
      comment: null,
      created_at: now,
    }];
    seed.deals = [{
      id: 1,
      client_id: 1,
      title: 'Deal A',
      amount: 100,
      stage: 'new',
      comment: null,
      close_date: null,
      created_at: now,
    }];
    seed.tasks = [{
      id: 1,
      client_id: 1,
      deal_id: 1,
      title: 'Task A',
      description: null,
      status: 'todo',
      is_done: false,
      due_date: null,
      created_at: now,
    }];

    await storageService.writeStore(seed);

    const clientsResponse = await request(app.getHttpServer()).post('/api/reports/clients').send({}).expect(201);
    const dealsResponse = await request(app.getHttpServer()).post('/api/reports/deals').send({}).expect(201);
    const tasksResponse = await request(app.getHttpServer()).post('/api/reports/tasks').send({}).expect(201);

    expect(clientsResponse.body).toEqual({
      title: 'CRM Export — Clients report',
      url: 'https://docs.google.com/spreadsheets/d/existing-spreadsheet/edit',
    });

    expect(dealsResponse.body).toEqual({
      title: 'CRM Export — Deals report',
      url: 'https://docs.google.com/spreadsheets/d/existing-spreadsheet/edit',
    });

    expect(tasksResponse.body).toEqual({
      title: 'CRM Export — Tasks report',
      url: 'https://docs.google.com/spreadsheets/d/existing-spreadsheet/edit',
    });

    expect(googleExportServiceMock.exportSheet).toHaveBeenCalledTimes(3);
    expect(googleExportServiceMock.exportSheet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        client_secret_json: expect.any(String),
        oauth_token_json: expect.any(String),
      }),
      {
        spreadsheetId: 'existing-spreadsheet',
        folderId: null,
      },
      expect.objectContaining({
        sheetTitle: 'Clients',
        headers: expect.arrayContaining(['ID', 'Name']),
      }),
    );
  });

  it('POST /reports/clients creates separate spreadsheet in folder mode when spreadsheet_id is absent', async () => {
    const seed = createEmptyCrmStore();
    seed.googleSettings.spreadsheet_id = null;
    seed.googleSettings.folder_id = 'drive-folder-123';
    seed.googleSettings.title_prefix = 'Team Prefix';
    seed.googleSettings.client_secret_json = JSON.stringify({
      installed: {
        client_id: 'abc.apps.googleusercontent.com',
        client_secret: 'secret-value',
      },
    });
    seed.googleSettings.oauth_token_json = JSON.stringify({ refresh_token: 'refresh-token' });

    await storageService.writeStore(seed);

    const response = await request(app.getHttpServer()).post('/api/reports/clients').send({}).expect(201);

    expect(response.body).toEqual({
      title: 'Team Prefix — Clients report',
      url: 'https://docs.google.com/spreadsheets/d/generated-sheet-id/edit',
    });

    expect(googleExportServiceMock.exportSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({
        client_secret_json: expect.any(String),
        oauth_token_json: expect.any(String),
      }),
      {
        spreadsheetId: null,
        folderId: 'drive-folder-123',
      },
      expect.objectContaining({
        title: 'Team Prefix — Clients report',
        sheetTitle: 'Clients',
      }),
    );
  });

  it('POST /reports/clients returns 400 when Google prerequisites are incomplete', async () => {
    const missingSecret = createEmptyCrmStore();
    await storageService.writeStore(missingSecret);
    await request(app.getHttpServer())
      .post('/api/reports/clients')
      .send({})
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('Для экспорта в Google загрузите OAuth client secret JSON в настройках.');
      });

    const missingToken = createEmptyCrmStore();
    missingToken.googleSettings.client_secret_json = JSON.stringify({
      installed: {
        client_id: 'abc.apps.googleusercontent.com',
        client_secret: 'secret-value',
      },
    });
    await storageService.writeStore(missingToken);
    await request(app.getHttpServer())
      .post('/api/reports/clients')
      .send({})
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('Подключите Google OAuth в настройках перед экспортом.');
      });

    const missingTarget = createEmptyCrmStore();
    missingTarget.googleSettings.client_secret_json = JSON.stringify({
      installed: {
        client_id: 'abc.apps.googleusercontent.com',
        client_secret: 'secret-value',
      },
    });
    missingTarget.googleSettings.oauth_token_json = JSON.stringify({ refresh_token: 'refresh-token' });
    await storageService.writeStore(missingTarget);
    await request(app.getHttpServer())
      .post('/api/reports/clients')
      .send({})
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('Укажите Spreadsheet ID или Folder ID в настройках Google.');
      });
  });
});
