import { IsBoolean, IsString, IsUUID, Matches } from 'class-validator';

export interface User {
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  user_preferences_id: string;
  user_id: string;
  daily_reminders: boolean;
  daily_reminder_time: string; // TIME format from PostgreSQL (e.g., "18:00:00")
  created_at: Date;
  updated_at: Date;
}

export class UpdatePreferencesDto {
  @IsUUID()
  user_id: string;

  @IsBoolean()
  daily_reminders: boolean;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'daily_reminder_time must be in HH:MM or HH:MM:SS format (24-hour)',
  })
  daily_reminder_time: string;
}