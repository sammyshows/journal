import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UsersResponseDto, UserResponseDto } from './users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users returned', type: UsersResponseDto })
  async getUsers(): Promise<UsersResponseDto> {
    try {
      return await this.usersService.getUsers();
    } catch (error) {
      console.error('Users query error:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create or update user' })
  @ApiResponse({ status: 200, description: 'User created/updated', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'user_id is required' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      return await this.usersService.createUser(createUserDto);
    } catch (error) {
      console.error('Create/update user error:', error);
      throw new HttpException(
        'Failed to create/update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}