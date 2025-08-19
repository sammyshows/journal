import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { CreateRequestDto, CreateResponseDto, JournalEntriesResponseDto, GetJournalEntriesRequestDto, JournalEntryResponseDto, GetJournalEntryRequestDto, UpdateRequestDto, UpdateResponseDto, DeleteRequestDto, DeleteResponseDto, UpdateDateTimeRequestDto, UpdateDateTimeResponseDto } from './journal.dto';

@ApiTags('journal')
@Controller()
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post('get-journal-entries')
  @ApiOperation({ summary: 'Get journal entries for a user' })
  @ApiResponse({ status: 200, description: 'Journal entries returned', type: JournalEntriesResponseDto })
  async getJournalEntries(@Body() body: GetJournalEntriesRequestDto): Promise<JournalEntriesResponseDto> {
    try {
      return await this.journalService.getJournalEntries(body.userId);
    } catch (error) {
      console.error('Journal entries query error:', error);
      throw new HttpException(
        'Failed to fetch journal entries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('get-journal-entry')
  @ApiOperation({ summary: 'Get journal entry for a user' })
  @ApiResponse({ status: 200, description: 'Journal entry returned', type: JournalEntryResponseDto })
  async getJournalEntry(@Body() body: GetJournalEntryRequestDto): Promise<JournalEntryResponseDto> {
    try {
      return await this.journalService.getJournalEntry(body.journalEntryId);
    } catch (error) {
      console.error('Journal entry query error:', error);
      throw new HttpException(
        'Failed to fetch journal entry',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-journal-entry')
  @ApiOperation({ summary: 'Create journal entry and process for graph' })
  @ApiResponse({ status: 200, description: 'Journal entry processed', type: CreateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid journal entry data' })
  @ApiResponse({ status: 500, description: 'Failed to process create request' })
  async create(@Body() createRequest: CreateRequestDto): Promise<CreateResponseDto> {
    try {
      return await this.journalService.createJournalEntry(createRequest);
    } catch (error) {
      console.error('Error in create API:', error);
      throw new HttpException(
        'Failed to process create request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-journal-entry')
  @ApiOperation({ summary: 'Update journal entry' })
  @ApiResponse({ status: 200, description: 'Journal entry updated', type: UpdateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid journal entry data' })
  @ApiResponse({ status: 500, description: 'Failed to process update request' })
  async update(@Body() body: UpdateRequestDto): Promise<UpdateResponseDto> {
    try {
      return await this.journalService.updateJournalEntry(body);
    } catch (error) {
      console.error('Error in update API:', error);
      throw new HttpException(
        'Failed to process update request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('delete-journal-entry')
  @ApiOperation({ summary: 'Delete journal entry' })
  @ApiResponse({ status: 200, description: 'Journal entry deleted', type: DeleteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid journal entry data' })
  @ApiResponse({ status: 500, description: 'Failed to process delete request' })
  async delete(@Body() body: DeleteRequestDto): Promise<DeleteResponseDto> {
    try {
      return await this.journalService.deleteJournalEntry(body.journalEntryId);
    } catch (error) {
      console.error('Error in delete API:', error);
      throw new HttpException(
        'Failed to process delete request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-journal-entry-datetime')
  @ApiOperation({ summary: 'Update journal entry date and time' })
  @ApiResponse({ status: 200, description: 'Journal entry date/time updated', type: UpdateDateTimeResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid journal entry data' })
  @ApiResponse({ status: 500, description: 'Failed to process datetime update request' })
  async updateDateTime(@Body() body: UpdateDateTimeRequestDto): Promise<UpdateDateTimeResponseDto> {
    try {
      return await this.journalService.updateJournalEntryDateTime(body);
    } catch (error) {
      console.error('Error in update datetime API:', error);
      throw new HttpException(
        'Failed to process datetime update request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}