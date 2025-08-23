import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ExploreMessage {
  @ApiProperty({ enum: ['user', 'ai'] })
  @IsString()
  @IsIn(['user', 'ai'])
  role: 'user' | 'ai';

  @ApiProperty()
  @IsString()
  content: string;
}

export class ExploreRequestDto {
  @ApiProperty({ type: [ExploreMessage] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExploreMessage)
  chat: ExploreMessage[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class JournalEntryCard {
  @ApiProperty()
  id: string;

  @ApiProperty()
  emoji: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  date: string;
}

export class ExploreResponseDto {
  @ApiProperty({ enum: ['followup', 'insight'] })
  @IsString()
  @IsIn(['followup', 'insight'])
  type: 'followup' | 'insight';

  @ApiProperty()
  @IsString()
  reply: string;

  @ApiProperty({ type: [JournalEntryCard], required: false })
  @IsOptional()
  entries?: JournalEntryCard[];
}

export class PreprocessedPromptResult {
  @ApiProperty()
  @IsNumber()
  clarity: number;

  @ApiProperty()
  @IsNumber()
  explorability: number;

  @ApiProperty()
  @IsString()
  improvedPrompt: string | null;

  @ApiProperty()
  @IsString()
  userReply: string | null;
}