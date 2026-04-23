import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { ClientsModule } from '../src/clients/clients.module';
import { DealsModule } from '../src/deals/deals.module';
import { StorageModule } from '../src/storage/storage.module';

describe('Deals (e2e)', () => {
  let app: INestApplication;
  let testDataDir: string;

  beforeAll(async () => {
    testDataDir = mkdtempSync(join(tmpdir(), 'crm-deals-e2e-'));
    process.env.DATA_DIR = testDataDir;

    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule, ClientsModule, DealsModule],
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

  it('creates, lists, and deletes deals linked to client', async () => {
    const createClientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'Deal Client' })
      .expect(201);

    const createDealPayload = {
      client_id: createClientResponse.body.id,
      title: 'Website redesign',
      amount: 15000,
      stage: 'new',
      comment: 'Priority lead',
      close_date: '2026-05-01T00:00:00.000Z',
    };

    const createDealResponse = await request(app.getHttpServer())
      .post('/api/deals')
      .send(createDealPayload)
      .expect(201);

    expect(createDealResponse.body).toEqual({
      id: expect.any(Number),
      client_id: createDealPayload.client_id,
      title: createDealPayload.title,
      amount: createDealPayload.amount,
      stage: createDealPayload.stage,
      comment: createDealPayload.comment,
      close_date: createDealPayload.close_date,
      created_at: expect.any(String),
    });

    const listResponse = await request(app.getHttpServer()).get('/api/deals').expect(200);

    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createDealResponse.body.id,
          client_id: createClientResponse.body.id,
          title: createDealPayload.title,
          amount: createDealPayload.amount,
          stage: createDealPayload.stage,
          comment: createDealPayload.comment,
          close_date: createDealPayload.close_date,
          created_at: expect.any(String),
        }),
      ]),
    );

    await request(app.getHttpServer()).delete(`/api/deals/${createDealResponse.body.id}`).expect(204);

    const listAfterDeleteResponse = await request(app.getHttpServer()).get('/api/deals').expect(200);

    expect(listAfterDeleteResponse.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createDealResponse.body.id }),
      ]),
    );
  });

  it('POST /deals rejects unknown client_id', async () => {
    await request(app.getHttpServer())
      .post('/api/deals')
      .send({
        client_id: 999999,
        title: 'Ghost deal',
        amount: 10,
        stage: 'new',
      })
      .expect(400);
  });

  it('DELETE /deals/:id returns 404 for missing deal', async () => {
    await request(app.getHttpServer()).delete('/api/deals/999999').expect(404);
  });

  it('DELETE /clients/:id rejects client removal when linked deals exist', async () => {
    const createClientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'Protected Client' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/deals')
      .send({
        client_id: createClientResponse.body.id,
        title: 'Protected deal',
        amount: 200,
        stage: 'new',
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/clients/${createClientResponse.body.id}`)
      .expect(400);
  });
});
