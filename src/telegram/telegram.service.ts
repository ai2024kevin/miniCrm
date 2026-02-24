import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { PersistenceService } from '../persistence/persistence.service';

type TextUpdate = {
  chat: { id: string | number };
  from?: { id: string | number };
  message_id: number;
  text?: string;
};

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: any = null;

  public constructor(
    private readonly configService: ConfigService,
    private readonly persistenceService: PersistenceService,
  ) {}

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
      void this.handleInboundText(message);
    });
  }

  private async handleInboundText(message: TextUpdate): Promise<void> {
    try {
      const chatId = String(message.chat.id);
      const userId = message.from?.id ? String(message.from.id) : undefined;

      await this.persistenceService.saveIncomingMessage({
        chatId,
        updateId: message.message_id,
        messageId: message.message_id,
        userId,
        text: message.text ?? '',
      });

      this.logger.log(`Inbound text message chatId=${chatId}`);
    } catch (error) {
      const normalized = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Inbound handler failed: ${normalized}`);
    }
  }

  protected createBot(token: string): any {
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
