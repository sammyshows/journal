import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { 
  UserPreferences,
  UpdatePreferencesDto 
} from './user-preferences.dto';

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(
    private databaseService: DatabaseService,
  ) {}


  async updateUserPreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreferences> {
    const client = await this.databaseService.getClient();
    
    try {
      // Normalize time format to HH:MM for database storage
      let normalizedTime = dto.daily_reminder_time;
      if (normalizedTime.includes(':')) {
        const timeParts = normalizedTime.split(':');
        normalizedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
      }

      this.logger.log(`Updating preferences for user ${userId}: reminders=${dto.daily_reminders}, time=${normalizedTime}`);

      const result = await client.query(
        `INSERT INTO user_preferences (user_id, daily_reminders, daily_reminder_time) 
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           daily_reminders = EXCLUDED.daily_reminders,
           daily_reminder_time = EXCLUDED.daily_reminder_time,
           updated_at = NOW()
         RETURNING *`,
        [userId, dto.daily_reminders, normalizedTime]
      );

      const updatedPrefs = result.rows[0];
      this.logger.log(`Successfully updated preferences:`, updatedPrefs);
      
      return updatedPrefs;
    } catch (error) {
      this.logger.error(`Failed to update user preferences: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const client = await this.databaseService.getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM user_preferences WHERE user_id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Failed to get user preferences: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

}