import { Pool } from 'pg';

export interface JournalEntry {
  id?: number;
  user_id: string;
  content: string;
  embedding?: number[];
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;
}

export class DatabaseClient {
  private pool: Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL || 
        'postgresql://postgres:postgres@localhost:5432/journal'
    });
  }

  async saveJournalEntry(entry: JournalEntry): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO journal_entries (user_id, content, embedding, metadata) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [
          entry.user_id,
          entry.content,
          entry.embedding ? `[${entry.embedding.join(',')}]` : null,
          JSON.stringify(entry.metadata || {})
        ]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let dbClient: DatabaseClient | null = null;

export function getDbClient(): DatabaseClient {
  if (!dbClient) {
    dbClient = new DatabaseClient();
  }
  return dbClient;
}