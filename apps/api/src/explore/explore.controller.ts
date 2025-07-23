import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { ExploreRequestDto, ExploreResponseDto } from './explore.dto';

@ApiTags('explore')
@Controller('explore')
export class ExploreController {
  constructor(
    private readonly exploreService: ExploreService
  ) {}

  @ApiOperation({ summary: 'Send explore message to AI' })
  @ApiResponse({ status: 200, description: 'AI response returned', type: ExploreResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid chat data' })
  @ApiResponse({ status: 500, description: 'Failed to process explore message request' })
  @Post()
  async explore(@Body() exploreRequest: ExploreRequestDto): Promise<ExploreResponseDto> {
    try {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      return await this.exploreService.processMessage(exploreRequest.chat, userId);
    } catch (error) {
      console.error('Explore error:', error);
      throw new HttpException(
        'Failed to process explore message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}