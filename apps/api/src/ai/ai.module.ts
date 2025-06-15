import { Module, Global } from '@nestjs/common';
import { AiService } from './ai.service';
import { PromptsService } from './prompts.service';

@Global()
@Module({
  providers: [AiService, PromptsService],
  exports: [AiService, PromptsService],
})
export class AiModule {}