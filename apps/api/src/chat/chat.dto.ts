import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessage {
  @ApiProperty({ enum: ['user', 'ai'] })
  @IsString()
  @IsIn(['user', 'ai'])
  role: 'user' | 'ai';

  @ApiProperty()
  @IsString()
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ type: [ChatMessage] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessage)
  chat: ChatMessage[];
}

export class ChatResponseDto {
  @ApiProperty()
  reply: string;
}