import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { JournalEntry } from '../common/interfaces';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL') || 
        'postgresql://postgres:postgres@localhost:5432/journal'
    });
  }

  async getClient() {
    return this.pool.connect();
  }

  async saveJournalEntry(entry: JournalEntry): Promise<string> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO journal_entries (user_id, content, embedding, metadata, title, emoji, user_summary, ai_summary) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING journal_entry_id`,
        [
          entry.user_id,
          entry.content,
          entry.embedding ? `[${entry.embedding.join(',')}]` : null,
          JSON.stringify(entry.metadata || {}),
          entry.title,
          entry.emoji,
          entry.user_summary,
          entry.ai_summary
        ]
      );
      return result.rows[0].journal_entry_id;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}