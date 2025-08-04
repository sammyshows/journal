import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { GraphProcessorService } from '../graph/processor.service';
import { CreateRequestDto, CreateResponseDto, DeleteResponseDto, JournalEntriesResponseDto, JournalEntry, JournalEntryResponseDto, UpdateRequestDto, UpdateResponseDto } from './journal.dto';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class JournalService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly aiService: AiService,
    private readonly graphProcessorService: GraphProcessorService,
    private readonly graphService: GraphService,
  ) {}

  async getJournalEntries(userId: string): Promise<JournalEntriesResponseDto> {
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
        WHERE je.user_id = $1
        GROUP BY je.journal_entry_id, je.title, je.emoji, je.content, je.user_summary, je.created_at, je.updated_at
        ORDER BY je.created_at DESC
        LIMIT 50
      `;

      const params: any[] = [userId];

      const result = await client.query(query, params);

      return {
        success: true,
        data: result.rows,
      };
    } finally {
      client.release();
    }
  }

  async getJournalEntry(entryId: string): Promise<JournalEntryResponseDto> {
    const client = await this.databaseService.getClient();
    const result = await client.query('SELECT * FROM journal_entries WHERE journal_entry_id = $1', [entryId]);
    return result.rows[0];
  }

  async createJournalEntry(createRequest: CreateRequestDto): Promise<CreateResponseDto> {
    const { journalEntryId, chat, userId, createdAt } = createRequest;
  
    if (!chat || !Array.isArray(chat)) {
      throw new BadRequestException('Invalid journal chat data');
    }

  
    const chatText = chat.length === 1
      ? chat[0]?.content || 'Oops, no content.'
      : chat.map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n");
  
    // Default variables
    let embedding = null;
    let summaries = { title: null, emoji: null, userSummary: null, aiSummary: null, tags: [] };
    let extraction = { nodes: [], edges: [] };

    // Run all AI-related work in parallel
    const [embeddingResult, summaryResult, graphResult] = await Promise.allSettled([
      this.aiService.getEmbeddings(chatText),
      this.aiService.summarizeJournalEntry(chatText),
      this.graphService.extractEntitiesAndRelationships(chatText)
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
    
    const entryId = await this.saveJournalEntry({
      journal_entry_id: journalEntryId,
      user_id: userId || 'default-user',
      content: chatText,
      embedding,
      title: summaries.title,
      emoji: summaries.emoji,
      user_summary: summaries.userSummary,
      ai_summary: summaries.aiSummary,
      tags: summaries.tags,
      metadata: {
        message_count: chat.length,
        created_via: 'web_app',
        model_used: 'voyage-3-large'
      },
      created_at: createdAt
    });
  
    console.log(`Journal entry saved with ID: ${entryId}`);
  
    // Process graph data (non-blocking, logs errors only)
    try {
      await this.graphProcessorService.processJournalEntryExtraction(
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

  async saveJournalEntry(entry: JournalEntry): Promise<string> {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');
  
      const columns = [
        "journal_entry_id",
        "user_id",
        "content",
        "embedding",
        "metadata",
        "title",
        "emoji",
        "user_summary",
        "ai_summary"
      ];
      const values = [
        entry.journal_entry_id,
        entry.user_id,
        entry.content,
        entry.embedding ? `[${entry.embedding.join(',')}]` : null,
        JSON.stringify(entry.metadata || {}),
        entry.title,
        entry.emoji,
        entry.user_summary,
        entry.ai_summary
      ];
  
      if (entry.created_at) {
        columns.push("created_at");
        values.push(entry.created_at);
      }
  
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  
      const result = await client.query(
        `INSERT INTO journal_entries (${columns.join(', ')}) VALUES (${placeholders}) RETURNING journal_entry_id`,
        values
      );
  
      const entryId = result.rows[0].journal_entry_id;
  
      // Insert tags if they exist
      if (entry.tags?.length > 0) {
        const tagValues: any[] = [];
        const tagPlaceholders: string[] = [];
  
        entry.tags.forEach((tag, i) => {
          tagValues.push(entryId, tag);
          tagPlaceholders.push(`($${2 * i + 1}, $${2 * i + 2})`);
        });
  
        await client.query(
          `INSERT INTO journal_entry_tags (journal_entry_id, tag) VALUES ${tagPlaceholders.join(', ')}`,
          tagValues
        );
      }
  
      await client.query('COMMIT');
      return entryId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Failed to save journal entry:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async updateJournalEntry(updateRequest: UpdateRequestDto): Promise<UpdateResponseDto> {
    const { journalEntryId, emoji, title } = updateRequest;

    const client = await this.databaseService.getClient();
    const result = await client.query(`
      UPDATE journal_entries SET updated_at = NOW(), emoji = $2, title = $3 WHERE journal_entry_id = $1
    `, [journalEntryId, emoji, title]);

    return {
      success: true,
      message: 'Journal entry updated successfully'
    };
  }

  async deleteJournalEntry(entryId: string): Promise<DeleteResponseDto> {
    const client = await this.databaseService.getClient();
    await client.query('DELETE FROM journal_entries WHERE journal_entry_id = $1', [entryId]);
    return { success: true };
  }
}