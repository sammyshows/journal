import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

export class User {
  @ApiProperty()
  name: string;

  @ApiProperty()
  user_id: string;
}

export class UsersResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [User] })
  data: User[];
}

export class UserResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: User })
  data: User;
}