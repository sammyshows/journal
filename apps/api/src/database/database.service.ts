import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL') || 'postgresql://postgres:postgres@localhost:5432/journal'
    });
  }

  async getClient() {
    return this.pool.connect();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}