import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { FinishRequestDto, FinishResponseDto, JournalEntriesResponseDto } from './journal.dto';

@ApiTags('journal')
@Controller()
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get('journal-entries')
  @ApiOperation({ summary: 'Get journal entries' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Journal entries returned', type: JournalEntriesResponseDto })
  async getJournalEntries(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Query('userId') userId?: string,
  ): Promise<JournalEntriesResponseDto> {
    try {
      return await this.journalService.getJournalEntries(
        parseInt(limit),
        parseInt(offset),
        userId,
      );
    } catch (error) {
      console.error('Journal entries query error:', error);
      throw new HttpException(
        'Failed to fetch journal entries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('finish')
  @ApiOperation({ summary: 'Finish journal entry and process for graph' })
  @ApiResponse({ status: 200, description: 'Journal entry processed', type: FinishResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid chat data' })
  @ApiResponse({ status: 500, description: 'Failed to process finish request' })
  async finish(@Body() finishRequest: FinishRequestDto): Promise<FinishResponseDto> {
    try {
      return await this.journalService.finishJournalEntry(finishRequest);
    } catch (error) {
      console.error('Error in finish API:', error);
      throw new HttpException(
        'Failed to process finish request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}