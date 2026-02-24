import { Global, Module } from '@nestjs/common';
import { ChatOrchestratorService } from '../chat/chat-orchestrator.service';
import { TelegramService } from './telegram.service';

@Global()
@Module({
  providers: [ChatOrchestratorService, TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
