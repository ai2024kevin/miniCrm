import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { GoogleExportService } from '../src/google/google-export.service';
import { GoogleSettingsModule } from '../src/google-settings/google-settings.module';
import { StorageModule } from '../src/storage/storage.module';

describe('Google settings (e2e)', () => {
  let app: INestApplication;
  let testDataDir: string;
  const authHeader = { Authorization: 'Bearer google-settings-e2e-token' };
  const googleExportServiceMock = {
    createAuthUrl: jest.fn().mockReturnValue({ auth_url: 'https://accounts.google.com/mock-auth' }),
    exchangeCode: jest.fn(async (_settings, code: string) => ({
      ok: true,
      has_oauth_token: true,
      tokenJson: JSON.stringify({ refresh_token: `refresh-for-${code}` }),
    })),
  };

  beforeAll(async () => {
    testDataDir = mkdtempSync(join(tmpdir(), 'crm-google-settings-e2e-'));
    process.env.DATA_DIR = testDataDir;
    process.env.CRM_AUTH_TOKEN = 'google-settings-e2e-token';

    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule, GoogleSettingsModule],
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
    await app.init();
  });

  afterAll(async () => {
    delete process.env.DATA_DIR;
    delete process.env.CRM_AUTH_TOKEN;

    if (app) {
      await app.close();
    }

    if (testDataDir) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('GET /settings/google returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/settings/google').expect(401);
  });

  it('GET /settings/google returns empty default state with token', async () => {
    const response = await request(app.getHttpServer()).get('/api/settings/google').set(authHeader).expect(200);

    expect(response.body).toEqual({
      spreadsheet_id: null,
      folder_id: null,
      title_prefix: null,
      has_client_secret: false,
      has_oauth_token: false,
    });
  });

  it('PUT /settings/google saves fields and keeps has_client_secret=false before upload', async () => {
    const payload = {
      spreadsheet_id: 'sheet-123',
      folder_id: 'folder-456',
      title_prefix: 'CRM Export',
    };

    const response = await request(app.getHttpServer())
      .put('/api/settings/google')
      .set(authHeader)
      .send(payload)
      .expect(200);

    expect(response.body).toEqual({
      ...payload,
      has_client_secret: false,
      has_oauth_token: false,
    });

    const getResponse = await request(app.getHttpServer()).get('/api/settings/google').set(authHeader).expect(200);

    expect(getResponse.body).toEqual({
      ...payload,
      has_client_secret: false,
      has_oauth_token: false,
    });
  });

  it('POST /settings/google/client-secret returns 400 when file is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/settings/google/client-secret')
      .set(authHeader)
      .expect(400);
  });

  it('POST /settings/google/client-secret returns 400 for invalid JSON payload', async () => {
    await request(app.getHttpServer())
      .post('/api/settings/google/client-secret')
      .set(authHeader)
      .attach('file', Buffer.from('{not valid json', 'utf-8'), 'client-secret.json')
      .expect(400);
  });

  it('POST /settings/google/client-secret returns 400 for invalid oauth shape', async () => {
    const invalidShape = JSON.stringify({
      installed: {
        client_id: 'abc.apps.googleusercontent.com',
      },
    });

    await request(app.getHttpServer())
      .post('/api/settings/google/client-secret')
      .set(authHeader)
      .attach('file', Buffer.from(invalidShape, 'utf-8'), 'client-secret.json')
      .expect(400);
  });

  it('POST /settings/google/client-secret rejects oversized upload and keeps has_client_secret=false', async () => {
    const oversizedJson = JSON.stringify({
      installed: {
        client_id: 'abc.apps.googleusercontent.com',
        client_secret: 'x'.repeat(70 * 1024),
      },
    });

    await request(app.getHttpServer())
      .post('/api/settings/google/client-secret')
      .set(authHeader)
      .attach('file', Buffer.from(oversizedJson, 'utf-8'), 'client-secret.json')
      .expect(413);

    const getResponse = await request(app.getHttpServer()).get('/api/settings/google').set(authHeader).expect(200);

    expect(getResponse.body).toEqual({
      spreadsheet_id: 'sheet-123',
      folder_id: 'folder-456',
      title_prefix: 'CRM Export',
      has_client_secret: false,
      has_oauth_token: false,
    });
  });

  it('POST /settings/google/client-secret uploads JSON and flips has_client_secret=true', async () => {
    const json = JSON.stringify({
      installed: {
        client_id: 'abc.apps.googleusercontent.com',
        client_secret: 'secret-value',
      },
    });

    const uploadResponse = await request(app.getHttpServer())
      .post('/api/settings/google/client-secret')
      .set(authHeader)
      .attach('file', Buffer.from(json, 'utf-8'), 'client-secret.json')
      .expect(201);

    expect(uploadResponse.body).toEqual({
      ok: true,
      has_client_secret: true,
    });

    const getResponse = await request(app.getHttpServer()).get('/api/settings/google').set(authHeader).expect(200);

    expect(getResponse.body).toEqual({
      spreadsheet_id: 'sheet-123',
      folder_id: 'folder-456',
      title_prefix: 'CRM Export',
      has_client_secret: true,
      has_oauth_token: false,
    });
  });

  it('GET /settings/google/oauth/start returns auth url when client secret is configured', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/settings/google/oauth/start')
      .set(authHeader)
      .expect(200);

    expect(response.body).toEqual({
      auth_url: 'https://accounts.google.com/mock-auth',
    });
  });

  it('POST /settings/google/oauth/exchange saves oauth token flag in settings state', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/settings/google/oauth/exchange')
      .set(authHeader)
      .send({ code: 'auth-code-123' })
      .expect(201);

    expect(response.body).toEqual({
      ok: true,
      has_oauth_token: true,
    });

    expect(googleExportServiceMock.exchangeCode).toHaveBeenCalled();

    const getResponse = await request(app.getHttpServer()).get('/api/settings/google').set(authHeader).expect(200);

    expect(getResponse.body).toEqual({
      spreadsheet_id: 'sheet-123',
      folder_id: 'folder-456',
      title_prefix: 'CRM Export',
      has_client_secret: true,
      has_oauth_token: true,
    });
  });

  it('POST /settings/google/oauth/exchange returns 400 for empty code', async () => {
    await request(app.getHttpServer())
      .post('/api/settings/google/oauth/exchange')
      .set(authHeader)
      .send({ code: '   ' })
      .expect(400);
  });
});
