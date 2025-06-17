import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMessage } from '../chat/chat.dto';

export class FinishRequestDto {
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

export class PaginationInfo {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  hasMore: boolean;
}

export class JournalEntriesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [JournalEntry] })
  data: JournalEntry[];

  @ApiProperty({ type: PaginationInfo })
  pagination: PaginationInfo;
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
