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

export class CreateRequestDto {
  @ApiProperty({ required: true })
  @IsString()
  journalEntryId: string

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
  timestamp?: string;
}

export class CreateResponseDto {
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
  timestamp?: string;

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

export class GetJournalEntriesRequestDto {
  @ApiProperty({ description: 'User ID to fetch journal entries for' })
  @IsString()
  userId: string;
}

export class JournalEntryResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: JournalEntry;
}

export class GetJournalEntryRequestDto {
  @ApiProperty({ description: 'Journal entry ID to fetch' })
  @IsString()
  journalEntryId: string;
}

export class UpdateRequestDto {
  @ApiProperty({ description: 'Journal entry ID to update' })
  @IsString()
  journalEntryId: string;

  @ApiProperty({ description: 'Emoji to update' })
  @IsString()
  emoji: string;

  @ApiProperty({ description: 'Title to update' })
  @IsString()
  title: string;
}

export class UpdateResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}

export class DeleteRequestDto {
  @ApiProperty({ description: 'Journal entry ID to delete' })
  @IsString()
  journalEntryId: string;
}

export class DeleteResponseDto {
  @ApiProperty()
  success: boolean;
}

export class UpdateDateTimeRequestDto {
  @ApiProperty({ description: 'Journal entry ID to update' })
  @IsString()
  journal_entry_id: string;

  @ApiProperty({ description: 'New timestamp for the journal entry' })
  @IsString()
  timestamp: string;
}

export class UpdateDateTimeResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}