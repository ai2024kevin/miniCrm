import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { ClientsModule } from '../src/clients/clients.module';
import { StorageModule } from '../src/storage/storage.module';

describe('Clients (e2e)', () => {
  let app: INestApplication;
  let testDataDir: string;

  beforeAll(async () => {
    testDataDir = mkdtempSync(join(tmpdir(), 'crm-clients-e2e-'));
    process.env.DATA_DIR = testDataDir;

    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule, ClientsModule],
    }).compile();

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

    if (app) {
      await app.close();
    }

    if (testDataDir) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('POST /clients creates a client with frontend-compatible shape', async () => {
    const payload = {
      name: 'Alice Doe',
      phone: '+1234567',
      email: 'alice@example.com',
      company: 'Acme LLC',
      status: 'active',
      comment: 'VIP',
    };

    const response = await request(app.getHttpServer())
      .post('/api/clients')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(Number),
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      company: payload.company,
      status: payload.status,
      comment: payload.comment,
      created_at: expect.any(String),
    });
  });

  it('GET /clients returns created clients list', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'Bob', status: 'archived' })
      .expect(201);

    const listResponse = await request(app.getHttpServer()).get('/api/clients').expect(200);

    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createResponse.body.id,
          name: 'Bob',
          phone: null,
          email: null,
          company: null,
          status: 'archived',
          comment: null,
          created_at: expect.any(String),
        }),
      ]),
    );
  });

  it('POST /clients defaults status to active and strips unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'No Extras', debug: 'remove-me' })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(Number),
      name: 'No Extras',
      phone: null,
      email: null,
      company: null,
      status: 'active',
      comment: null,
      created_at: expect.any(String),
    });

    expect(response.body).not.toHaveProperty('debug');
  });

  it('POST /clients rejects invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: '   ', email: 'not-an-email', status: 'unknown' })
      .expect(400);
  });

  it('DELETE /clients/:id deletes a client and returns 204', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'Delete Me', status: 'active' })
      .expect(201);

    await request(app.getHttpServer()).delete(`/api/clients/${createResponse.body.id}`).expect(204);

    const listResponse = await request(app.getHttpServer()).get('/api/clients').expect(200);

    expect(listResponse.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createResponse.body.id }),
      ]),
    );
  });

  it('DELETE /clients/:id returns 404 for missing client', async () => {
    await request(app.getHttpServer()).delete('/api/clients/999999').expect(404);
  });
});
