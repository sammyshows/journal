import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GraphService } from './graph.service';
import { 
  NodesResponseDto, 
  EdgesResponseDto, 
  SoulMapResponseDto, 
  TopNodesResponseDto 
} from './graph.dto';

@ApiTags('graph')
@Controller()
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('nodes')
  @ApiOperation({ summary: 'Get nodes with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Nodes returned', type: NodesResponseDto })
  async getNodes(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ): Promise<NodesResponseDto> {
    try {
      return await this.graphService.getNodes(parseInt(limit), parseInt(offset));
    } catch (error) {
      console.error('Error fetching nodes:', error);
      throw new HttpException(
        'Failed to fetch nodes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('edges')
  @ApiOperation({ summary: 'Get edges with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Edges returned', type: EdgesResponseDto })
  async getEdges(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ): Promise<EdgesResponseDto> {
    try {
      return await this.graphService.getEdges(parseInt(limit), parseInt(offset));
    } catch (error) {
      console.error('Error fetching edges:', error);
      throw new HttpException(
        'Failed to fetch edges',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('soul-map')
  @ApiOperation({ summary: 'Get soul map data for user' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Soul map data returned', type: SoulMapResponseDto })
  async getSoulMap(
    @Query('userId') userId: string = '123e4567-e89b-12d3-a456-426614174000',
  ): Promise<SoulMapResponseDto> {
    try {
      return await this.graphService.getSoulMap(userId);
    } catch (error) {
      console.error('Soul map fetch error:', error);
      throw new HttpException(
        'Failed to fetch soul map data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('top-nodes')
  @ApiOperation({ summary: 'Get top nodes by importance' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'relatedTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Top nodes returned', type: TopNodesResponseDto })
  async getTopNodes(
    @Query('limit') limit: string = '5',
    @Query('userId') userId?: string,
    @Query('relatedTo') relatedToNodeId?: string,
  ): Promise<TopNodesResponseDto> {
    try {
      return await this.graphService.getTopNodes(parseInt(limit), userId, relatedToNodeId);
    } catch (error) {
      console.error('Error fetching top nodes:', error);
      throw new HttpException(
        'Failed to fetch top nodes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}