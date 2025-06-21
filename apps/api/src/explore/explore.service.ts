import { Injectable, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { getJournalAIRolePrompt } from '../common/prompts';
import { ExploreMessage } from './explore.dto';

@Injectable()
export class ExploreService {
  constructor(
    private readonly aiService: AiService,
  ) {}

  async processExploreMessage(chat: ExploreMessage[]): Promise<string> {
    if (!chat || !Array.isArray(chat)) {
      throw new BadRequestException('Invalid explore message data');
    }

    const rolePrompt = getJournalAIRolePrompt();
    const chatMessages = chat
      .map((msg) =>
        msg.role === "user"
          ? `User: ${msg.content}`
          : `Assistant: ${msg.content}`
      )
      .join("\n");
    
    const prompt = `${rolePrompt}\n\n${chatMessages}\nAssistant:`;

    return await this.aiService.sendMessage(prompt);
  }
}