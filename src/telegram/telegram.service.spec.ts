import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  it('starts and stops polling when token exists', async () => {
    const on = jest.fn();
    const stopPolling = jest.fn().mockResolvedValue(undefined);
    const bot = { on, stopPolling } as unknown as TelegramBot;

    const config = {
      get: jest.fn().mockReturnValue('token'),
    } as unknown as ConfigService;

    class TestTelegramService extends TelegramService {
      protected createBot(_token: string): TelegramBot {
        return bot;
      }
    }

    const service = new TestTelegramService(config);

    service.onModuleInit();
    await service.onModuleDestroy();

    expect(on).toHaveBeenCalled();
    expect(stopPolling).toHaveBeenCalledTimes(1);
  });
});
