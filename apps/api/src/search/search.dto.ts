import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SearchRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class RelatedEntry {
  @ApiProperty()
  journal_entry_id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  similarity_score: number;
}

export class SearchResponseDto {
  @ApiProperty()
  query: string;

  @ApiProperty()
  response: string;

  @ApiProperty({ type: [RelatedEntry] })
  related_entries: RelatedEntry[];
}