import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { ExploreRequestDto, ExploreResponseDto } from './explore.dto';

@ApiTags('explore')
@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Post()
  @ApiOperation({ summary: 'Send explore message to AI' })
  @ApiResponse({ status: 200, description: 'AI response returned', type: ExploreResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid chat data' })
  @ApiResponse({ status: 500, description: 'Failed to process explore message request' })
  async explore(@Body() exploreRequest: ExploreRequestDto): Promise<ExploreResponseDto> {
    try {
      const reply = await this.exploreService.processExploreMessage(exploreRequest.message);
      return { reply };
    } catch (error) {
      console.error('Error in explore API:', error);
      throw new HttpException(
        'Failed to process explore message request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}