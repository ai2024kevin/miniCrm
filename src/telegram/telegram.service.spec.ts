import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  it('starts and stops polling when token exists', async () => {
    const on = jest.fn();
    const stopPolling = jest.fn().mockResolvedValue(undefined);
    const bot = { on, stopPolling };

    const config = {
      get: jest.fn().mockReturnValue('token'),
    } as unknown as ConfigService;
    const persistenceService = {
      saveIncomingMessage: jest.fn().mockResolvedValue(undefined),
    };

    class TestTelegramService extends TelegramService {
      protected createBot(_token: string): any {
        return bot;
      }
    }

    const service = new TestTelegramService(config, persistenceService as never);

    service.onModuleInit();
    await service.onModuleDestroy();

    expect(on).toHaveBeenCalled();
    expect(stopPolling).toHaveBeenCalledTimes(1);
  });
});
