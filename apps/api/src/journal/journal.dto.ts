import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class JournalMessage {
  @ApiProperty({ enum: ['user', 'ai'] })
  @IsString()
  @IsIn(['user', 'ai'])
  role: 'user' | 'ai';

  @ApiProperty()
  @IsString()
  content: string;
}

export class FinishRequestDto {
  @ApiProperty({ required: true })
  @IsString()
  journal_entry_id: string

  @ApiProperty({ type: [JournalMessage] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalMessage)
  chat: JournalMessage[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  created_at?: string;
}

export class FinishResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  entryId: string;

  @ApiProperty()
  message: string;
}

export class JournalEntry {
  @ApiProperty()
  journal_entry_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  ai_summary: string;

  @ApiProperty()
  emoji: string;

  @ApiProperty()
  user_summary: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  embedding: number[];

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  @IsOptional()
  created_at?: string;

  @ApiProperty()
  @IsOptional()
  updated_at?: string;
}

export class JournalEntriesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [JournalEntry] })
  data: JournalEntry[];
}

export class JournalSummaries {
  @ApiProperty()
  title: string;

  @ApiProperty()
  emoji: string;

  @ApiProperty()
  userSummary: string;

  @ApiProperty()
  aiSummary: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
