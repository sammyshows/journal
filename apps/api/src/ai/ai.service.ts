import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { JournalSummaries } from '../journal/journal.dto';

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

  async summarizeJournalEntry(text: string): Promise<JournalSummaries> {
    const prompt = `
      You are a journaling assistant. Analyze the user's journal entry and return a structured JSON object with the following fields:

      1. **title** – A short 1–3 word title summarizing the core theme.
      2. **emoji** – A single emoji that captures the tone or emotion of the entry.
      3. **userSummary** – A 1–2 sentence recap suitable for the user to review later.
      4. **aiSummary** – A private AI-only summary capturing deeper emotional patterns, recurring themes, or meaningful insights. This will be used to build a long-term user profile.
      5. **tags** – An array of 3 concise keywords (e.g. "Burnout", "Family", "Motivation") that capture emotional themes, topics, or recurring ideas in the entry.

      🧪 Output format:
      Return ONLY the raw JSON object below — no markdown, no backticks:
      {
        "title": "string (1–3 words)",
        "emoji": "string (1 emoji)",
        "userSummary": "string (1–2 sentences)",
        "aiSummary": "string (concise, insightful)",
        "tags": ["Tag1", "Tag2", "Tag3"]
      }

      📘 Examples:

      ### Example 1:
      Journal Entry:
      > I’m feeling overwhelmed lately. Work is piling up and I can’t seem to find the motivation to tackle it. I know I’ve had these cycles before, but this one feels heavier. I just want a break but I feel guilty even thinking about rest.

      Output:
      {
        "title": "Burnout Spiral",
        "emoji": "🔥",
        "userSummary": "Feeling overwhelmed by work and struggling to find motivation.",
        "aiSummary": "Recurring burnout theme tied to guilt around rest and self-worth. Shows patterns of high internal pressure.",
        "tags": ["Burnout", "Work", "Guilt"]
      }

      ### Example 2:
      Journal Entry:
      > Caught up with Mum today and it brought back a wave of childhood memories. We cooked together like we used to. I feel more grounded after days of feeling lost.

      Output:
      {
        "title": "Chatting with Mum",
        "emoji": "👩‍👧",
        "userSummary": "Reflected on a meaningful time with Mum that helped ease recent emotional uncertainty.",
        "aiSummary": "Reconnection with a core relationship provided emotional grounding. Indicates strong nostalgic triggers tied to family rituals.",
        "tags": ["Family", "Nostalgia", "Connection"]
      }

      Now analyze the following entry and generate your output in the same format. Return only the JSON object.

      ### User Journal Entry:
      ${text}
    `.trim()
     .replace(/^```json/, '')
     .replace(/^```/, '')
     .replace(/```$/, '')
     .trim();
  
    const raw = await this.sendToAnthropicAPI(prompt);
  
    try {
      console.log('raw ai summary json', typeof raw, raw)

      return JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse AI summary JSON:", raw);
      throw new Error("AI summary response could not be parsed");
    }
  }
}