import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { GraphService } from '../graph/graph.service';
import { FinishRequestDto, FinishResponseDto, JournalEntriesResponseDto } from './journal.dto';
import { ChatMessage } from '../chat/chat.dto';

@Injectable()
export class JournalService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly aiService: AiService,
    private readonly graphService: GraphService,
  ) {}

  async getJournalEntries(
    limit: number,
    offset: number,
    userId?: string,
  ): Promise<JournalEntriesResponseDto> {
    const client = await this.databaseService.getClient();
    
    try {
      let query = `
        SELECT 
          content,
          created_at
        FROM journal_entries
      `;
      const params: any[] = [];

      if (userId) {
        query += ` WHERE user_id = $1`;
        params.push(userId);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM journal_entries';
      const countParams: any[] = [];
      
      if (userId) {
        countQuery += ' WHERE user_id = $1';
        countParams.push(userId);
      }

      const countResult = await client.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        success: true,
        data: result.rows,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      };
    } finally {
      client.release();
    }
  }

  async finishJournalEntry(finishRequest: FinishRequestDto): Promise<FinishResponseDto> {
    const { chat, userId } = finishRequest;

    if (!chat || !Array.isArray(chat)) {
      throw new BadRequestException('Invalid chat data');
    }

    console.log('Processing chat for embeddings and database storage...');
    
    let chatText: string;
    if (chat.length === 1) {
      chatText = chat[0]?.content || 'Oops, no content.';
    } else {
      chatText = chat
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
    }
    
    const embedding = await this.aiService.getEmbeddings(chatText);
    
    const entryId = await this.databaseService.saveJournalEntry({
      user_id: userId || 'default-user',
      content: chatText,
      embedding: embedding,
      metadata: {
        message_count: chat.length,
        created_via: 'web_app',
        model_used: 'voyage-3-large'
      }
    });
    
    console.log(`Journal entry saved with ID: ${entryId}`);
    
    // Process graph data synchronously (with error handling)
    try {
      console.log('Processing graph data synchronously...');
      const extraction = await this.graphService.extractNodesAndEdges(chatText);
      console.log(`Extracted ${extraction.nodes.length} nodes and ${extraction.edges.length} edges`);
      
      await this.graphService.processJournalEntryForGraph(userId || 'default-user', entryId, extraction);
      console.log('Graph processing completed successfully');
    } catch (error) {
      console.warn('Graph processing failed (continuing without graph data):', error);
      // Don't fail the main request if graph processing fails
    }
    
    return { 
      success: true, 
      entryId,
      message: 'Journal entry successfully saved and processed for graph data'
    };
  }
}