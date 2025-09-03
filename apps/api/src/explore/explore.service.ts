import { Injectable, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { DatabaseService } from '../database/database.service';
import { getJournalAIRolePrompt, getPreprocessMessagePrompt, getExploreChatPrompt } from '../common/prompts';
import { ExploreMessage, ExploreResponseDto, PreprocessedPromptResult } from './explore.dto';
import { parseAIResponseObject } from '../utils/ai-response.utils';

@Injectable()
export class ExploreService {
  constructor(
    private readonly aiService: AiService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Main orchestration method for processing user prompts
   * Handles two different behaviors based on message count:
   * - Single message: New exploration with preprocessing and vector search
   * - Multiple messages: Ongoing chat with response generation only
   */
  async processMessage(chat: ExploreMessage[], userId: string): Promise<ExploreResponseDto> {
    if (!chat || !Array.isArray(chat) || chat.length === 0) {
      throw new BadRequestException('Invalid explore message data');
    }

    // Determine if this is a new exploration or ongoing chat
    if (chat.length === 1) {
      return this.handleFirstMessage(chat[0], userId);
    } else {
      const aiReply = await this.generateChatResponse(chat);
      console.log('--------------------------------\n[processMessage] AI reply:\n', aiReply, '\n--------------------------------');
  
      return { type: 'insight', reply: aiReply };
    }
  }

  /**
   * Handle new exploration (single message)
   */
  private async handleFirstMessage(message: ExploreMessage, userId: string): Promise<ExploreResponseDto> {
    console.log('--------------------------------\n[handleFirstMessage] Starting...\n--------------------------------');
    const userPrompt = message.content;

    // Step 1: Preprocess the prompt to assess quality and improve it
    const preprocessed = await this.preprocessPromptForEmbedding(userPrompt);

    // Step 2: Check confidence and branch logic
    const invalidData = !preprocessed.clarity || !preprocessed.explorability;
    const lowClarity = preprocessed.clarity < 0.3;
    const lowExplorability = preprocessed.explorability < 0.4;
    
    if (invalidData || lowClarity || lowExplorability) {
      console.log('--------------------------------\n[handleFirstMessage] Low confidence - returning followup reply\n--------------------------------');
      // Low confidence - return followup reply
      return {
        type: 'followup',
        reply: preprocessed.userReply || 'I\'d love to help you explore your thoughts. Could you tell me more about what\'s on your mind?'
      };
    }

    // Step 3: High confidence - proceed with embedding and vector search
    const embedding = await this.aiService.getEmbeddings(preprocessed.improvedPrompt);

    const journalEntries = await this.findSimilarJournalEntries(userId, embedding);

    console.log('--------------------------------\n[handleFirstMessage] Journal entries:\n', journalEntries.map((entry: any) => entry.content), '\n--------------------------------');

    // Step 4: Generate AI response based on the matches and original prompt
    const aiReply = await this.generateChatResponse([message], journalEntries);
    console.log('--------------------------------\n[handleFirstMessage] AI reply:\n', aiReply, '\n--------------------------------');

    return {
      type: 'insight',
      reply: aiReply,
      entries: journalEntries.map(entry => ({
        id: entry.journal_entry_id,
        emoji: entry.emoji || '📝',
        title: entry.title || 'Journal Entry',
        summary: entry.user_summary,
        date: entry.created_at
      }))
    };
  }

  /**
   * Preprocesses a user prompt to clarify intent and rate suitability for vector search.
   */
  private async preprocessPromptForEmbedding(userPrompt: string): Promise<PreprocessedPromptResult> {
    console.log('--------------------------------\n[preprocessPromptForEmbedding] Starting...\n--------------------------------');
    const systemPrompt = getPreprocessMessagePrompt(userPrompt)

    const response = await this.aiService.sendToAnthropicAPI(systemPrompt, 'sonnet');

    console.log('--------------------------------\n[preprocessPromptForEmbedding] Response:\n', response, '\n--------------------------------');

    // Parse the JSON from Claude's response
    let result: PreprocessedPromptResult;
    try {
      result = parseAIResponseObject(response);
    } catch (e) {
      throw new Error('Failed to parse Claude response: ' + response);
    }
    return result;
  }

  /**
   * Find similar journal entries using vector similarity search
   */
  private async findSimilarJournalEntries(userId: string, embedding: number[]): Promise<any[]> {
    const client = await this.databaseService.getClient();
    
    try {
      const searchQuery = `
        SELECT 
          journal_entry_id,
          emoji,
          title,
          content,
          user_summary,
          ai_summary,
          created_at,
          1 - (embedding <=> $1::vector) as similarity_score
        FROM journal_entries 
        WHERE embedding IS NOT NULL AND user_id = $2
        ORDER BY embedding <=> $1::vector
        LIMIT 3
      `;

      const searchResult = await client.query(searchQuery, [JSON.stringify(embedding), userId]);
      // Filter out those with similarity_score less than 0.6 (i.e., keep only >= 0.6)
      console.log('--------------------------------\n[findSimilarJournalEntries] Search result:\n', searchResult.rows.map((row: any) => row.similarity_score), '\n--------------------------------');
      return searchResult.rows.filter((row: any) => row.similarity_score >= 0.5);
    } finally {
      client.release();
    }
  }

  /**
   * Generate AI response for chat with optional journal entry context
   */
  private async generateChatResponse(chat: ExploreMessage[], journalEntries?: any[]): Promise<string> {
    // Build chat messages with relevant entries included
    let chatMessages = '';
    
    // Add relevant entries as context at the start if they exist
    if (journalEntries?.length > 0) {
      chatMessages += 'Relevant entries:\n';
      journalEntries.forEach((entry: any) => {
        chatMessages += `${new Date(entry.created_at).toLocaleDateString()}: ${entry.content}\n\n`;
      });
      chatMessages += 'Current conversation:\n';
    }
    
    // Add the actual chat messages
    chatMessages += chat
      .map((msg) =>
        msg.role === "user"
          ? `User: ${msg.content}`
          : `Assistant: ${msg.content}`
      )
      .join("\n");

    const systemPrompt = getExploreChatPrompt(chatMessages, journalEntries);

    console.log('--------------------------------\n[generateChatResponse] System prompt:\n', systemPrompt, '\n--------------------------------');
    return await this.aiService.sendToAnthropicAPI(systemPrompt, 'sonnet');
  }

  // Legacy method for backward compatibility
  async processExploreMessage(chat: ExploreMessage[]): Promise<ExploreResponseDto> {
    return this.processMessage(chat, 'default-user');
  }

  // Legacy method for backward compatibility
  async vectorSearch(prompt: string) {
    // This method is now handled within processMessage
    throw new Error('Use processMessage() instead of vectorSearch()');
  }
}