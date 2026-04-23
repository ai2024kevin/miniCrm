import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { HealthController } from '../src/health/health.controller';
import { StorageModule } from '../src/storage/storage.module';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let testDataDir: string;
  let storeFilePath: string;

  beforeAll(async () => {
    testDataDir = mkdtempSync(join(tmpdir(), 'crm-storage-e2e-'));
    storeFilePath = join(testDataDir, 'crm-store.json');
    process.env.DATA_DIR = testDataDir;

    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule],
      controllers: [HealthController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: ['health'],
    });
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

  it('/health (GET)', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });

    expect(existsSync(storeFilePath)).toBe(true);

    const store = JSON.parse(readFileSync(storeFilePath, 'utf-8')) as Record<string, unknown>;

    expect(store).toEqual({
      users: [],
      clients: [],
      deals: [],
      tasks: [],
      googleSettings: {
        spreadsheet_id: null,
        folder_id: null,
        title_prefix: null,
        client_secret_json: null,
        oauth_token_json: null,
      },
    });
  });
});
