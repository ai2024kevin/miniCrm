import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type InboundMessageInput = {
  chatId: string;
  updateId: number;
  messageId?: number;
  userId?: string;
  text: string;
};

@Injectable()
export class PersistenceService {
  public constructor(private readonly prisma: PrismaService) {}

  public async saveIncomingMessage(input: InboundMessageInput): Promise<{
    session: { id: string; chatId: string };
    message: { id: string; text: string };
    plan: { id: string; summary: string };
  }> {
    const session = await this.prisma.session.upsert({
      where: { chatId: input.chatId },
      update: {},
      create: { chatId: input.chatId },
    });

    const message = await this.prisma.message.upsert({
      where: {
        telegramChatId_telegramUpdateId: {
          telegramChatId: input.chatId,
          telegramUpdateId: input.updateId,
        },
      },
      update: {
        text: input.text,
      },
      create: {
        telegramChatId: input.chatId,
        telegramUpdateId: input.updateId,
        telegramMessageId: input.messageId,
        telegramUserId: input.userId,
        role: 'user',
        text: input.text,
        sessionId: session.id,
      },
    });

    const plan = await this.prisma.plan.upsert({
      where: { sessionId: session.id },
      update: {
        summary: input.text,
      },
      create: {
        sessionId: session.id,
        summary: input.text,
      },
    });

    return { session, message, plan };
  }

  public async saveAssistantMessage(input: {
    sessionId: string;
    chatId: string;
    text: string;
  }): Promise<void> {
    await this.prisma.message.create({
      data: {
        telegramChatId: input.chatId,
        telegramUpdateId: Date.now(),
        role: 'assistant',
        text: input.text,
        sessionId: input.sessionId,
      },
    });
  }

  public async getRecentSessionMessages(
    sessionId: string,
    limit = 20,
  ): Promise<Array<{ role: string; text: string; createdAt: Date }>> {
    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
