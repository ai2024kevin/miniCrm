import { Injectable } from '@nestjs/common';
import { AiService, ChatTurn } from '../ai/ai.service';
import { PersistenceService } from '../persistence/persistence.service';

type InboundPayload = {
  chatId: string;
  updateId: number;
  messageId?: number;
  userId?: string;
  text: string;
};

@Injectable()
export class ChatOrchestratorService {
  public constructor(
    private readonly persistenceService: PersistenceService,
    private readonly aiService: AiService,
  ) {}

  public async processInbound(payload: InboundPayload): Promise<string> {
    const saved = await this.persistenceService.saveIncomingMessage(payload);
    const recent = await this.persistenceService.getRecentSessionMessages(saved.session.id, 20);

    const ordered = [...recent].reverse();
    const turns: ChatTurn[] = ordered.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.text,
    }));

    const reply = await this.aiService.generateResponse(turns);
    await this.persistenceService.saveAssistantMessage({
      sessionId: saved.session.id,
      chatId: payload.chatId,
      text: reply,
    });

    return reply;
  }
}
