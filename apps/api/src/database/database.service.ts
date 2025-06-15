import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

export interface JournalEntry {
  journal_entry_id?: string;
  user_id: string;
  content: string;
  embedding?: number[];
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;
}

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
        `INSERT INTO journal_entries (user_id, content, embedding, metadata) 
         VALUES ($1, $2, $3, $4) 
         RETURNING journal_entry_id`,
        [
          entry.user_id,
          entry.content,
          entry.embedding ? `[${entry.embedding.join(',')}]` : null,
          JSON.stringify(entry.metadata || {})
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