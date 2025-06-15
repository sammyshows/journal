import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage } from '../common/interfaces';

@Injectable()
export class AiService {
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  async sendToAnthropicAPI(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    if (Array.isArray(response.content)) {
      return response.content
        .map(part => {
          if (typeof part === "string") return part;
          if (part.type === "text") return part.text;
          return "";
        })
        .join("");
    }
    
    return typeof response.content === "string" ? response.content : "";
  }

  async sendMessage(prompt: string): Promise<string> {
    return this.sendToAnthropicAPI(prompt);
  }

  createClient(): Anthropic {
    return this.anthropic;
  }

  async getEmbeddings(text: string): Promise<number[]> {
    const apiKey = this.configService.get<string>('VOYAGE_API_KEY');
    
    if (!apiKey) {
      throw new Error('VOYAGE_API_KEY environment variable is not set');
    }

    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: [text],
        model: 'voyage-3-large'
      })
    });

    if (!response.ok) {
      throw new Error(`Voyage AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0]?.embedding;
    
    if (!embedding) {
      throw new Error('No embedding returned from Voyage AI');
    }

    return embedding;
  }
}