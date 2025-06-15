import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchRequestDto, SearchResponseDto } from './search.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: 'Search journal entries using vector similarity' })
  @ApiResponse({ status: 200, description: 'Search results returned', type: SearchResponseDto })
  @ApiResponse({ status: 400, description: 'Query is required' })
  @ApiResponse({ status: 500, description: 'Search failed' })
  async search(@Body() searchRequest: SearchRequestDto): Promise<SearchResponseDto> {
    try {
      return await this.searchService.search(searchRequest.query);
    } catch (error) {
      console.error('Search error:', error);
      throw new HttpException(
        'Search failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}