import { 
  Controller, 
  Body, 
  Param, 
  Get, 
  Post
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
import { 
  UpdatePreferencesDto, 
  UserPreferences 
} from './user-preferences.dto';

@ApiTags('user-preferences')
@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private userPreferencesService: UserPreferencesService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ 
    status: 200, 
    description: 'User preferences retrieved successfully',
    type: Object
  })
  async getUserPreferences(@Param('userId') userId: string): Promise<UserPreferences | null> {
    return this.userPreferencesService.getUserPreferences(userId);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ 
    status: 200, 
    description: 'Preferences updated successfully',
    type: Object
  })
  async updatePreferences(@Body() dto: UpdatePreferencesDto): Promise<UserPreferences> {
    return this.userPreferencesService.updateUserPreferences(dto.user_id, dto);
  }
}