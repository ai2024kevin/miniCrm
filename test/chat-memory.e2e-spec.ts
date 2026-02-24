import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../src/ai/ai.service';
import { ChatOrchestratorService } from '../src/chat/chat-orchestrator.service';
import { PersistenceService } from '../src/persistence/persistence.service';
import { TelegramService } from '../src/telegram/telegram.service';

describe('Chat memory (e2e)', () => {
  it('uses at most last 20 messages in AI call', async () => {
    const messages = Array.from({ length: 20 }).map((_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      text: `msg-${index + 1}`,
      createdAt: new Date(index + 1),
    }));

    const persistenceMock = {
      saveIncomingMessage: jest.fn().mockResolvedValue({
        session: { id: 'session-1', chatId: '100' },
        message: { id: 'message-1', text: 'hello' },
        plan: { id: 'plan-1', summary: 'hello' },
      }),
      getRecentSessionMessages: jest.fn().mockResolvedValue(messages),
      saveAssistantMessage: jest.fn().mockResolvedValue(undefined),
    };
    const aiMock = {
      generateResponse: jest.fn().mockResolvedValue('answer'),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatOrchestratorService,
        { provide: PersistenceService, useValue: persistenceMock },
        { provide: AiService, useValue: aiMock },
      ],
    }).compile();

    const orchestrator = moduleRef.get(ChatOrchestratorService);
    await orchestrator.processInbound({
      chatId: '100',
      updateId: 1,
      messageId: 1,
      userId: '200',
      text: 'hello',
    });

    expect(aiMock.generateResponse).toHaveBeenCalledTimes(1);
    expect(aiMock.generateResponse.mock.calls[0][0].length).toBeLessThanOrEqual(20);
  });

  it('processes Telegram inbound and attempts to send reply', async () => {
    const on = jest.fn();
    const sendMessage = jest.fn().mockResolvedValue(undefined);

    const chatOrchestratorMock = {
      processInbound: jest.fn().mockResolvedValue('bot reply'),
    };
    const configMock = {
      get: jest.fn((key: string) => (key === 'TELEGRAM_BOT_TOKEN' ? 'token' : undefined)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: ChatOrchestratorService, useValue: chatOrchestratorMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    const service = moduleRef.get(TelegramService);
    jest.spyOn<any, any>(service as any, 'createBot').mockReturnValue({
      on,
      stopPolling: jest.fn().mockResolvedValue(undefined),
      sendMessage,
    });

    service.onModuleInit();
    const textHandler = on.mock.calls.find((call: unknown[]) => call[0] === 'text')?.[1];
    if (!textHandler) {
      throw new Error('text handler not registered');
    }

    await textHandler({
      chat: { id: 100 },
      from: { id: 200 },
      message_id: 500,
      text: 'hi',
    });

    expect(chatOrchestratorMock.processInbound).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith('100', 'bot reply');
  });
});
