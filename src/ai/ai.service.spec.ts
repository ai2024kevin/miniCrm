import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService', () => {
  it('returns fallback when OpenAI throws', async () => {
    const config = {
      get: jest.fn().mockReturnValue('test-key'),
    } as unknown as ConfigService;

    const mockClient = {
      responses: {
        create: jest.fn().mockRejectedValue(new Error('boom')),
      },
    };

    class TestAiService extends AiService {
      protected createClient(): any {
        return mockClient;
      }
    }

    const service = new TestAiService(config);
    const text = await service.generateResponse([{ role: 'user', content: 'hi' }]);

    expect(text).toContain('не удалось сгенерировать');
  });
});
