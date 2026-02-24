import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

type TextUpdate = TelegramBot.Message;

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot | null = null;

  public constructor(private readonly configService: ConfigService) {}

  public onModuleInit(): void {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is empty, polling disabled');
      return;
    }

    this.bot = this.createBot(token);

    this.bot.on('polling_error', (error: Error) => {
      this.logger.error(`Polling error: ${error.message}`);
    });

    this.bot.on('text', (message: TextUpdate) => {
      this.logger.log(`Inbound text message chatId=${message.chat.id}`);
    });
  }

  protected createBot(token: string): TelegramBot {
    return new TelegramBot(token, {
      polling: {
        autoStart: true,
        params: {
          timeout: 30,
        },
      },
    });
  }

  public async onModuleDestroy(): Promise<void> {
    if (!this.bot) {
      return;
    }

    await this.bot.stopPolling();
    this.bot = null;
  }
}
