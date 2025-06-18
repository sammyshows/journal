import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { EntityExtractionService } from '../common/entity-extraction.service';
import { GraphProcessorService } from '../common/graph-processor.service';
import { FinishRequestDto, FinishResponseDto, JournalEntriesResponseDto, JournalSummaries } from './journal.dto';
import { ChatMessage } from '../chat/chat.dto';

@Injectable()
export class JournalService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly aiService: AiService,
    private readonly entityExtractionService: EntityExtractionService,
    private readonly graphProcessorService: GraphProcessorService,
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
          je.journal_entry_id,
          je.title,
          je.emoji,
          je.content,
          je.user_summary,
          je.created_at,
          je.updated_at,
          COALESCE(array_agg(jet.tag) FILTER (WHERE jet.tag IS NOT NULL), ARRAY[]::text[]) as tags
        FROM journal_entries je
        LEFT JOIN journal_entry_tags jet ON je.journal_entry_id = jet.journal_entry_id
        GROUP BY je.journal_entry_id, je.title, je.emoji, je.content, je.user_summary, je.created_at, je.updated_at
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
  
    console.log('Processing journal entry...');
  
    const chatText = chat.length === 1
      ? chat[0]?.content || 'Oops, no content.'
      : chat.map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n");
  
    // Default variables
    let embedding = null;
    let summaries = { title: null, emoji: null, userSummary: null, aiSummary: null };
    let extraction = { nodes: [], edges: [] };

    // Run all AI-related work in parallel
    const [embeddingResult, summaryResult, graphResult] = await Promise.allSettled([
      this.aiService.getEmbeddings(chatText),
      this.aiService.summarizeJournalEntry(chatText),
      this.entityExtractionService.extractNodesAndEdges(chatText)
    ]);
    
    if (embeddingResult.status === 'fulfilled')
      embedding = embeddingResult.value;
    else
      console.warn("Embedding generation failed:", embeddingResult.reason);
    
    if (summaryResult.status === 'fulfilled')
      summaries = summaryResult.value;
    else
      console.warn("Summarization failed:", summaryResult.reason);
    
    if (graphResult.status === 'fulfilled')
      extraction = graphResult.value;
    else
      console.warn("Graph extraction failed:", graphResult.reason);
  
    console.log(`Extracted ${extraction.nodes.length} nodes and ${extraction.edges.length} edges`);
    
    const entryId = await this.databaseService.saveJournalEntry({
      user_id: userId || 'default-user',
      content: chatText,
      embedding,
      title: summaries.title,
      emoji: summaries.emoji,
      user_summary: summaries.userSummary,
      ai_summary: summaries.aiSummary,
      metadata: {
        message_count: chat.length,
        created_via: 'web_app',
        model_used: 'voyage-3-large'
      }
    });
  
    console.log(`Journal entry saved with ID: ${entryId}`);
  
    // Process graph data (non-blocking, logs errors only)
    try {
      await this.graphProcessorService.processJournalEntryForGraph(
        userId || 'default-user',
        entryId,
        extraction
      );
      console.log('Graph processing completed successfully');
    } catch (error) {
      console.warn('Graph processing failed (continuing without graph data):', error);
    }
  
    return {
      success: true,
      entryId,
      message: 'Journal entry successfully saved and processed.'
    };
  }  
}