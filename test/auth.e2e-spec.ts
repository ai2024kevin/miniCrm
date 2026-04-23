import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { StorageModule } from '../src/storage/storage.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let testDataDir: string;

  beforeAll(async () => {
    testDataDir = mkdtempSync(join(tmpdir(), 'crm-auth-e2e-'));
    process.env.DATA_DIR = testDataDir;
    process.env.CRM_LOGIN = 'dev-admin';
    process.env.CRM_PASSWORD = 'dev-password';
    process.env.CRM_AUTH_TOKEN = 'dev-auth-token';

    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule, AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: ['health'],
    });
    await app.init();
  });

  afterAll(async () => {
    delete process.env.DATA_DIR;
    delete process.env.CRM_LOGIN;
    delete process.env.CRM_PASSWORD;
    delete process.env.CRM_AUTH_TOKEN;

    if (app) {
      await app.close();
    }

    if (testDataDir) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('POST /auth/login returns ok and token for env-backed credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: 'dev-admin', password: 'dev-password' })
      .expect(200)
      .expect({ ok: true, token: 'dev-auth-token' });
  });

  it('POST /auth/login returns 401 for invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: 'dev-admin', password: 'wrong-password' })
      .expect(401);
  });
});
