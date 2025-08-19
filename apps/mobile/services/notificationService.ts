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
        shouldShowAlert: true, // Keep for now to avoid breaking changes
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

      if (!this.hasInitialized) {
        const preferences = await this.getUserPreferences(userId);
        if (preferences?.daily_reminders) {
          await this.scheduleDailyReminder(preferences.daily_reminder_time);
        }
        this.hasInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async scheduleDailyReminder(reminderTime: string): Promise<void> {
    try {
      // FOR TESTING: Schedule notification 3 seconds from now
      // TODO: Change this to use actual daily reminder time
      const testNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to reflect! 📝",
          body: "How was your day? Take a moment to write in your journal.",
          data: { type: 'daily_reminder', scheduledTime: reminderTime },
        },
        trigger: { seconds: 3 }, // FOR TESTING ONLY
      });

      this.dailyNotificationId = testNotificationId;

      /* TODO: Replace the test trigger above with actual daily scheduling
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to reflect! 📝",
          body: "How was your day? Take a moment to write in your journal.",
          data: { type: 'daily_reminder' },
        },
        trigger: {
          date: scheduledTime,
          repeats: true,
        },
      });

      this.dailyNotificationId = notificationId;
      console.log(`Daily reminder scheduled for ${reminderTime} daily`);
      */

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
      await this.rescheduleDailyReminder(
        preferences.daily_reminders,
        preferences.daily_reminder_time
      );
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 📝",
        body: "This is a test notification to verify local notifications work!",
        data: { type: 'test' },
      },
      trigger: { seconds: 2 },
    });
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