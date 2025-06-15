import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto, UsersResponseDto, UserResponseDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUsers(): Promise<UsersResponseDto> {
    const client = await this.databaseService.getClient();
    
    try {
      const query = `
        SELECT 
          name,
          user_id
        FROM users
        ORDER BY created_at DESC
      `;

      const result = await client.query(query);

      return {
        success: true,
        data: result.rows
      };
    } finally {
      client.release();
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { user_id, name } = createUserDto;

    if (!user_id) {
      throw new BadRequestException('user_id is required');
    }

    const client = await this.databaseService.getClient();
    
    try {
      const query = `
        INSERT INTO users (user_id, name)
        VALUES ($1, $2)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await client.query(query, [
        user_id,
        name || null
      ]);

      return {
        success: true,
        data: result.rows[0]
      };
    } finally {
      client.release();
    }
  }
}