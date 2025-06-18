import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMessage } from '../chat/chat.dto';

export class FinishRequestDto {
  @ApiProperty({ required: true })
  @IsString()
  journal_entry_id: string

  @ApiProperty({ type: [ChatMessage] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessage)
  chat: ChatMessage[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;
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
  content: string;

  @ApiProperty()
  created_at: Date;
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
}
