import { Injectable, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { getJournalAIRolePrompt } from '../common/prompts';
import { ChatMessage } from './chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly aiService: AiService,
  ) {}

  async processChat(chat: ChatMessage[]): Promise<string> {
    if (!chat || !Array.isArray(chat)) {
      throw new BadRequestException('Invalid chat data');
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