import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { ClientsModule } from '../src/clients/clients.module';
import { DealsModule } from '../src/deals/deals.module';
import { StorageModule } from '../src/storage/storage.module';
import { TasksModule } from '../src/tasks/tasks.module';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let testDataDir: string;

  beforeAll(async () => {
    testDataDir = mkdtempSync(join(tmpdir(), 'crm-tasks-e2e-'));
    process.env.DATA_DIR = testDataDir;

    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule, ClientsModule, DealsModule, TasksModule],
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

  it('creates, lists, and deletes tasks in snake_case contract', async () => {
    const createClientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'Task Client' })
      .expect(201);

    const createDealResponse = await request(app.getHttpServer())
      .post('/api/deals')
      .send({
        client_id: createClientResponse.body.id,
        title: 'Task Deal',
        amount: 500,
        stage: 'new',
      })
      .expect(201);

    const createTaskPayload = {
      client_id: createClientResponse.body.id,
      deal_id: createDealResponse.body.id,
      title: 'Follow up call',
      description: 'Call before Friday',
      status: 'done',
      is_done: false,
      due_date: '2026-05-02T00:00:00.000Z',
    };

    const createTaskResponse = await request(app.getHttpServer())
      .post('/api/tasks')
      .send(createTaskPayload)
      .expect(201);

    expect(createTaskResponse.body).toEqual({
      id: expect.any(Number),
      client_id: createTaskPayload.client_id,
      deal_id: createTaskPayload.deal_id,
      title: createTaskPayload.title,
      description: createTaskPayload.description,
      status: createTaskPayload.status,
      is_done: createTaskPayload.is_done,
      due_date: createTaskPayload.due_date,
      created_at: expect.any(String),
    });

    const listResponse = await request(app.getHttpServer()).get('/api/tasks').expect(200);

    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createTaskResponse.body.id,
          client_id: createTaskPayload.client_id,
          deal_id: createTaskPayload.deal_id,
          title: createTaskPayload.title,
          description: createTaskPayload.description,
          status: createTaskPayload.status,
          is_done: false,
          due_date: createTaskPayload.due_date,
          created_at: expect.any(String),
        }),
      ]),
    );

    await request(app.getHttpServer()).delete(`/api/tasks/${createTaskResponse.body.id}`).expect(204);

    const listAfterDeleteResponse = await request(app.getHttpServer()).get('/api/tasks').expect(200);

    expect(listAfterDeleteResponse.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createTaskResponse.body.id }),
      ]),
    );
  });

  it('POST /tasks rejects unknown links and invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        client_id: 999999,
        deal_id: 999999,
        title: 'Bad task',
        status: 'todo',
        is_done: false,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        title: '   ',
        status: 'in_progress',
        is_done: 'nope',
      })
      .expect(400);
  });

  it('POST /tasks rejects mismatched client_id and deal_id pair', async () => {
    const firstClient = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'Client A' })
      .expect(201);

    const secondClient = await request(app.getHttpServer())
      .post('/api/clients')
      .send({ name: 'Client B' })
      .expect(201);

    const deal = await request(app.getHttpServer())
      .post('/api/deals')
      .send({
        client_id: firstClient.body.id,
        title: 'Client A deal',
        amount: 100,
        stage: 'new',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({
        client_id: secondClient.body.id,
        deal_id: deal.body.id,
        title: 'Broken link',
        status: 'todo',
        is_done: false,
      })
      .expect(400);
  });

  it('DELETE /tasks/:id returns 404 for missing task', async () => {
    await request(app.getHttpServer()).delete('/api/tasks/999999').expect(404);
  });
});
