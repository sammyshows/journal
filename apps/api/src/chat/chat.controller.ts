import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './chat.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send chat message to AI' })
  @ApiResponse({ status: 200, description: 'AI response returned', type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid chat data' })
  @ApiResponse({ status: 500, description: 'Failed to process chat request' })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      const reply = await this.chatService.processChat(chatRequest.chat);
      return { reply };
    } catch (error) {
      console.error('Error in chat API:', error);
      throw new HttpException(
        'Failed to process chat request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}