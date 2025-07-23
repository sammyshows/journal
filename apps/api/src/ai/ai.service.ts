import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { JournalSummaries } from '../journal/journal.dto';
import { parseAIResponseObject } from '../utils/ai-response.utils';
import { getSummarizeJournalEntryPrompt } from '../common/prompts';

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

  async sendToAnthropicAPI(prompt: string, modelName: string): Promise<string> {
    // See models: https://docs.anthropic.com/en/docs/about-claude/models/overview#model-names
    let model = "claude-3-5-haiku-20241022";
    if (modelName === 'sonnet') {
      model = "claude-sonnet-4-20250514";
    } 

    const response = await this.anthropic.messages.create({
      model,
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

  async summarizeJournalEntry(text: string): Promise<JournalSummaries> {
    const prompt = getSummarizeJournalEntryPrompt(text)
  
    const raw = await this.sendToAnthropicAPI(prompt, 'sonnet');
  
    try {
      return parseAIResponseObject(raw);
    } catch (err) {
      console.error("Failed to parse AI summary JSON:", raw);
      throw new Error("AI summary response could not be parsed");
    }
  }
}