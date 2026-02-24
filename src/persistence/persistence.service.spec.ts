import { PersistenceService } from './persistence.service';

describe('PersistenceService', () => {
  it('upserts session, message and plan for inbound text', async () => {
    const prisma: any = {
      session: {
        upsert: jest.fn().mockResolvedValue({ id: 's1', chatId: '10' }),
      },
      message: {
        upsert: jest.fn().mockResolvedValue({ id: 'm1', text: 'hello' }),
      },
      plan: {
        upsert: jest.fn().mockResolvedValue({ id: 'p1', summary: 'hello' }),
      },
    };

    const service = new PersistenceService(prisma);
    const result = await service.saveIncomingMessage({
      chatId: '10',
      updateId: 42,
      messageId: 42,
      userId: '20',
      text: 'hello',
    });

    expect(prisma.session.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.message.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.plan.upsert).toHaveBeenCalledTimes(1);
    expect(result.message.text).toBe('hello');
  });
});
