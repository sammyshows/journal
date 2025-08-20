import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettingsStore } from '../stores/useAppSettingsStore';
import { useUserStore } from '../stores/useUserStore';
import { TimePicker } from './TimePicker';
import notificationService, { UserPreferences } from '../services/notificationService';

interface NotificationPreferencesProps {
  userId: string;
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const { theme } = useAppSettingsStore();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPermissions();
  }, [userId]);

  const checkPermissions = async () => {
    try {
      const permission = await notificationService.requestPermissions();
      setHasPermissions(permission.granted);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const userPrefs = await notificationService.getUserPreferences(userId);
      setPreferences(userPrefs || {
        user_preferences_id: '',
        user_id: userId,
        daily_reminders: false, // Default to false so user can toggle on
        daily_reminder_time: '18:00',
        created_at: '',
        updated_at: '',
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Set default preferences if loading fails
      setPreferences({
        user_preferences_id: '',
        user_id: userId,
        daily_reminders: false,
        daily_reminder_time: '18:00',
        created_at: '',
        updated_at: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<Pick<UserPreferences, 'daily_reminders' | 'daily_reminder_time'>>) => {
    if (!preferences) {
      console.error('No preferences available to update');
      return;
    }

    try {
      setSaving(true);
      
      // Always send both fields, ensuring time is in proper format
      const updatedData = {
        daily_reminders: updates.daily_reminders ?? preferences.daily_reminders,
        daily_reminder_time: updates.daily_reminder_time ?? preferences.daily_reminder_time,
      };

      // Ensure time is in HH:MM format (strip seconds if present)
      if (updatedData.daily_reminder_time.includes(':')) {
        const timeParts = updatedData.daily_reminder_time.split(':');
        updatedData.daily_reminder_time = `${timeParts[0]}:${timeParts[1]}`;
      }

      console.log('Sending update request with data:', updatedData);
      
      const updatedPrefs = await notificationService.updateUserPreferences(userId, updatedData);
      setPreferences(updatedPrefs);
      console.log('Preferences updated successfully:', updatedPrefs);

      // Update local notifications after successful preference update
      await notificationService.updateLocalNotifications(updatedData);
      console.log('Local notifications updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', `Failed to update notification preferences: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminders = async (enabled: boolean) => {
    if (enabled && !hasPermissions) {
      const permission = await notificationService.requestPermissions();
      if (!permission.granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive daily reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
      setHasPermissions(true);
    }
    
    await updatePreferences({ daily_reminders: enabled });
  };

  const handleTimeSelect = async (time: string) => {
    await updatePreferences({ daily_reminder_time: time });
  };

  const testNotification = async () => {
    try {
      await notificationService.scheduleTestNotification();
      console.log('Test notification scheduled (3 seconds)');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const showScheduledNotifications = async () => {
    try {
      const scheduled = await notificationService.getAllScheduledNotifications();
      Alert.alert(
        'Scheduled Notifications', 
        `You have ${scheduled.length} scheduled notification(s).`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      Alert.alert('Error', 'Failed to get scheduled notifications');
    }
  };

  if (loading) {
    return (
      <View style={{ 
        backgroundColor: theme.surface, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: theme.border,
        padding: 16,
        alignItems: 'center'
      }}>
        <Text style={{ color: theme.secondaryText }}>Loading preferences...</Text>
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={{ 
        backgroundColor: theme.surface, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: theme.border,
        padding: 16,
        alignItems: 'center'
      }}>
        <Text style={{ color: theme.secondaryText }}>Failed to load preferences</Text>
        <TouchableOpacity onPress={loadPreferences} style={{ marginTop: 8 }}>
          <Text style={{ color: theme.primary }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDisplayTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <View style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'semibold' }}>
            Daily Reminders
          </Text>
        </View>
        
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}>
          {/* Enable/Disable Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="notifications" size={20} color={theme.secondaryText} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '500' }}>
                  Enable Reminders
                </Text>
                <Text style={{ color: theme.secondaryText, fontSize: 14, marginTop: 2 }}>
                  Get daily reminders to write in your journal
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.daily_reminders}
              onValueChange={handleToggleReminders}
              trackColor={{ false: theme.border, true: `${theme.primary}40` }}
              thumbColor={preferences.daily_reminders ? theme.primary : theme.secondaryText}
              disabled={saving}
            />
          </View>

          {/* Time Selection */}
          {preferences.daily_reminders && (
            <View>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                disabled={saving}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="time" size={20} color={theme.secondaryText} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '500' }}>
                      Reminder Time
                    </Text>
                    <Text style={{ color: theme.secondaryText, fontSize: 14, marginTop: 2 }}>
                      When would you like to be reminded?
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ 
                    color: theme.primary, 
                    fontSize: 16, 
                    fontWeight: '600',
                    marginRight: 8 
                  }}>
                    {formatDisplayTime(preferences.daily_reminder_time)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={{ marginTop: 16, gap: 8 }}>
                <TouchableOpacity
                  onPress={testNotification}
                  disabled={saving}
                  style={{
                    backgroundColor: `${theme.primary}10`,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="send" size={16} color={theme.primary} />
                  <Text style={{ 
                    color: theme.primary, 
                    fontSize: 14, 
                    fontWeight: '500',
                    marginLeft: 8
                  }}>
                    Test Notification (3s)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={showScheduledNotifications}
                  disabled={saving}
                  style={{
                    backgroundColor: `${theme.secondaryText}10`,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="list" size={16} color={theme.secondaryText} />
                  <Text style={{ 
                    color: theme.secondaryText, 
                    fontSize: 14, 
                    fontWeight: '500',
                    marginLeft: 8
                  }}>
                    View Scheduled
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Permission Status */}
          {!hasPermissions && (
            <View style={{
              backgroundColor: `${theme.primary}10`,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="warning" size={16} color={theme.primary} />
              <Text style={{ 
                color: theme.primary, 
                fontSize: 14,
                marginLeft: 8,
                flex: 1
              }}>
                Local notification permissions are required for reminders to work
              </Text>
            </View>
          )}

          {saving && (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: theme.secondaryText, fontSize: 14 }}>
                Saving preferences...
              </Text>
            </View>
          )}
        </View>
      </View>

      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={handleTimeSelect}
        currentTime={preferences.daily_reminder_time}
        title="Daily Reminder Time"
      />
    </>
  );
}