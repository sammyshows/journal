import * as Notifications from 'expo-notifications';
import apiClient from './api/client';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

export interface UserPreferences {
  user_preferences_id: string;
  user_id: string;
  daily_reminders: boolean;
  daily_reminder_time: string;
  created_at: string;
  updated_at: string;
}

class NotificationService {
  private isConfigured: boolean = false;
  private dailyNotificationId: string | null = null;
  private hasInitialized: boolean = false;

  private configureNotifications(): void {
    if (this.isConfigured) return;
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    
    this.isConfigured = true;
  }

  async requestPermissions(): Promise<NotificationPermissionStatus> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      finalStatus = status;

      return {
        granted: finalStatus === 'granted',
        canAskAgain,
        status: finalStatus,
      };
    }

    return {
      granted: true,
      canAskAgain: false,
      status: finalStatus,
    };
  }

  async initializeNotifications(userId: string): Promise<void> {
    try {
      this.configureNotifications();
      const permissionResult = await this.requestPermissions();
      
      if (!permissionResult.granted) return;

      this.hasInitialized = true;
      console.log('Notifications initialized');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async scheduleDailyReminder(reminderTime: string): Promise<void> {
    try {
      console.log(`Scheduling daily reminder for ${reminderTime}`);
      
      // Parse the time (format: "HH:MM" or "HH:MM:SS")
      const timeParts = reminderTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time format: ${reminderTime}`);
      }

      console.log(`Scheduling daily notification for ${hours}:${minutes.toString().padStart(2, '0')}`);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to reflect! 📝",
          body: "How was your day? Take a moment to write in your journal.",
          data: { 
            type: 'daily_reminder', 
            scheduledTime: reminderTime
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      this.dailyNotificationId = notificationId;
      console.log(`Daily reminder scheduled with ID: ${notificationId} for ${reminderTime} daily`);
      
      // Verify the notification was scheduled
      const scheduledNotifications = await this.getAllScheduledNotifications();
      console.log(`Total scheduled notifications: ${scheduledNotifications.length}`);
      
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      throw error;
    }
  }

  async cancelDailyReminder(): Promise<void> {
    try {
      if (this.dailyNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.dailyNotificationId);
        console.log('Cancelled existing daily reminder');
        this.dailyNotificationId = null;
      }
    } catch (error) {
      console.error('Error cancelling daily reminder:', error);
    }
  }

  async rescheduleDailyReminder(enabled: boolean, reminderTime?: string): Promise<void> {
    await this.cancelDailyReminder();
    
    if (enabled && reminderTime) {
      await this.scheduleDailyReminder(reminderTime);
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      return await apiClient.get<UserPreferences>(`/user-preferences/${userId}`);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(userId: string, preferences: {
    daily_reminders: boolean;
    daily_reminder_time: string;
  }): Promise<UserPreferences> {
    try {
      const updatedPrefs = await apiClient.post<UserPreferences>(
        `/user-preferences/update`,
        {
          user_id: userId,
          ...preferences
        }
      );
      return updatedPrefs;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update preferences: ${error.message || error}`);
    }
  }

  async updateLocalNotifications(preferences: {
    daily_reminders: boolean;
    daily_reminder_time: string;
  }): Promise<void> {
    try {
      // Always cancel existing notifications first
      await this.cancelDailyReminder();
      
      // Only schedule if reminders are enabled
      if (preferences.daily_reminders) {
        console.log('Scheduling daily reminder because it\'s enabled');
        await this.scheduleDailyReminder(preferences.daily_reminder_time);
      } else {
        console.log('Not scheduling daily reminder because it\'s disabled');
      }
    } catch (error) {
      console.error('Error updating local notifications:', error);
    }
  }

  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  async scheduleTestNotification(): Promise<void> {
    console.log('Scheduling test notification for 3 seconds from now');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 📝",
        body: "This is a test notification to verify local notifications work!",
        data: { type: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });
    
    console.log('Test notification scheduled successfully');
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.dailyNotificationId = null;
  }
}

export default new NotificationService();