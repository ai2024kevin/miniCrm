import { AiService } from '../ai/ai.service';
import { PersistenceService } from '../persistence/persistence.service';
import { ChatOrchestratorService } from './chat-orchestrator.service';

describe('ChatOrchestratorService', () => {
  it('sends at most 20 messages to AI', async () => {
    const messages = Array.from({ length: 25 }).map((_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      text: `m-${index + 1}`,
      createdAt: new Date(index + 1),
    }));

    const persistence: Partial<PersistenceService> = {
      saveIncomingMessage: jest.fn().mockResolvedValue({
        session: { id: 's1', chatId: '1' },
        message: { id: 'm1', text: 'hello' },
        plan: { id: 'p1', summary: 'hello' },
      }),
      getRecentSessionMessages: jest.fn().mockResolvedValue(messages.slice(0, 20)),
      saveAssistantMessage: jest.fn().mockResolvedValue(undefined),
    };

    const ai: Partial<AiService> = {
      generateResponse: jest.fn().mockResolvedValue('ok'),
    };

    const service = new ChatOrchestratorService(persistence as PersistenceService, ai as AiService);

    await service.processInbound({
      chatId: '1',
      updateId: 10,
      messageId: 10,
      userId: '2',
      text: 'hello',
    });

    const aiCalls = (ai.generateResponse as jest.Mock).mock.calls;
    expect(aiCalls).toHaveLength(1);
    expect(aiCalls[0][0].length).toBeLessThanOrEqual(20);
  });
});
