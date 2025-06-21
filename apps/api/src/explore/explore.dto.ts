import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn, ValidateNested } from 'class-validator';
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
}

export class ExploreResponseDto {
  @ApiProperty()
  reply: string;
}