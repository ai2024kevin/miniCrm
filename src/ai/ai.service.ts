import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type ChatTurn = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly fallbackMessage =
    'Извините, сейчас не удалось сгенерировать ответ. Попробуйте еще раз через минуту.';

  public constructor(private readonly configService: ConfigService) {}

  public async generateResponse(turns: ChatTurn[]): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is empty, fallback response returned');
      return this.fallbackMessage;
    }

    try {
      const client = this.createClient(apiKey);
      const response = await client.responses.create({
        model: 'gpt-4.1-mini',
        input: turns.map((turn) => ({
          role: turn.role,
          content: turn.content,
        })),
      });

      const text = response.output_text?.trim();
      if (!text) {
        return this.fallbackMessage;
      }

      return text;
    } catch (error) {
      const normalized = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`OpenAI request failed: ${normalized}`);
      return this.fallbackMessage;
    }
  }

  protected createClient(apiKey: string): OpenAI {
    return new OpenAI({ apiKey });
  }
}
