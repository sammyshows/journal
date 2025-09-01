import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StreakCounter } from '../../components/StreakCounter';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { NotificationPreferences } from '../../components/NotificationPreferences';
import * as apiService from '../../services/api';
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';
import { useUserStore, User } from '../../stores/useUserStore';
import { useJournalStore } from '../../stores/useJournalStore';
import notificationService from '../../services/notificationService';
import { resetLocalDatabase } from '../../services/journalDatabase';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode } = useAppSettingsStore();
  const { currentUser, users, setCurrentUser } = useUserStore();
  const { fetchEntries } = useJournalStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('8:00 PM');

  useEffect(() => {
    // loadUserStats();
  }, []);

  // useEffect(() => {
  //   // Reload stats when user changes
  //   if (currentUser) {
  //     loadUserStats();
  //   }
  // }, [currentUser.id]);

  // const loadUserStats = async () => {
  //   try {
  //     const data = await apiService.getUserStats(currentUser.id);
  //     setStats(data);
  //   } catch (error) {
  //     console.error('Error loading user stats:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleUserSelect = async (user: User) => {
    if (user.id !== currentUser.id) {
      await setCurrentUser(user);
      // Refetch journal entries for the new user
      await fetchEntries(user.id);
    }
  };

  const handleReminderToggle = (value: boolean) => {
    setRemindersEnabled(value);
    // In a real app, this would save the setting
    console.log('Reminders enabled:', value);
  };

  const handleReminderTimePress = () => {
    Alert.alert(
      'Reminder Time',
      'Choose when you\'d like to be reminded to journal',
      [
        { text: 'Morning (8:00 AM)', onPress: () => setReminderTime('8:00 AM') },
        { text: 'Afternoon (2:00 PM)', onPress: () => setReminderTime('2:00 PM') },
        { text: 'Evening (8:00 PM)', onPress: () => setReminderTime('8:00 PM') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your journal entries as a PDF or text file',
      [
        { text: 'PDF', onPress: () => console.log('Export as PDF') },
        { text: 'Text', onPress: () => console.log('Export as text') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your journal entries. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => console.log('Delete account') 
        }
      ]
    );
  };

  const viewScheduledNotifications = async () => {
    try {
      const notifications = await notificationService.getAllScheduledNotifications();
      
      if (notifications.length === 0) {
        Alert.alert('Scheduled Notifications', 'No notifications are currently scheduled.');
        return;
      }

      const notificationList = notifications.map((notif, index) => 
        `${index + 1}. ${notif.content.title || 'Journal Reminder'}\n   Trigger: ${JSON.stringify(notif.trigger, null, 2)}`
      ).join('\n\n');

      Alert.alert(
        'Scheduled Notifications', 
        `Found ${notifications.length} scheduled notification(s):\n\n${notificationList}`,
        [{ text: 'OK' }],
        { userInterfaceStyle: theme.name === 'dark' ? 'dark' : 'light' }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get scheduled notifications: ' + error);
    }
  };

  const handleResetLocalDatabase = () => {
    Alert.alert(
      'Reset Local Database',
      'This will delete all local journal entries. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetLocalDatabase();
              Alert.alert('Success', 'Local database has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset database: ' + error);
            }
          }
        }
      ],
      { userInterfaceStyle: theme.name === 'dark' ? 'dark' : 'light' }
    );
  };

  const testNotification = async () => {
    try {
      await notificationService.scheduleTestNotification();
      Alert.alert('Test Notification', 'Test notification scheduled for 3 seconds from now.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification: ' + error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Profile</Text>
          <Text style={{ color: theme.secondaryText, fontSize: 16 }}>Manage your journaling experience</Text>
        </View>

        {/* User Selection Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold', marginBottom: 16 }}>
              Users
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => handleUserSelect(user)}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: user.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                      borderWidth: currentUser.id === user.id ? 3 : 0,
                      borderColor: currentUser.id === user.id ? theme.text : 'transparent',
                    }}
                  >
                    <Ionicons 
                      name="person" 
                      size={24} 
                      color="white" 
                    />
                  </View>
                  <Text style={{ 
                    color: theme.text, 
                    fontSize: 14, 
                    fontWeight: currentUser.id === user.id ? 'bold' : 'normal' 
                  }}>
                    {user.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold', marginBottom: 8 }}>
                Your Journey
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <StreakCounter streak={stats.streak} size="medium" />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme.secondaryText, fontSize: 16 }}>This Week</Text>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold' }}>
                      {stats.currentWeekEntries}/{stats.weeklyGoal}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: theme.border, borderRadius: 16, height: 8 }}>
                <View
                  style={{ 
                    backgroundColor: theme.primary, 
                    borderRadius: 16, 
                    height: 8,
                    width: `${Math.min((stats.currentWeekEntries / stats.weeklyGoal) * 100, 100)}%`
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Settings Sections */}
        <View style={{ paddingHorizontal: 24, gap: 24 }}>
          {/* Preferences */}
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'semibold' }}>Preferences</Text>
            </View>
            
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="moon" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Theme</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['system', 'light', 'dark'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setThemeMode(mode)}
                      style={{
                        backgroundColor: themeMode === mode ? '#fde9d3' : '#f3f4f6',
                        borderRadius: 16,
                        paddingVertical: 4,
                        paddingHorizontal: 6,
                        marginLeft: mode === 'system' ? 0 : 8,
                        borderWidth: themeMode === mode ? 1.5 : 1,
                        borderColor: themeMode === mode ? '#ec8320' : '#e5e7eb',
                      }}
                    >
                      <Text
                        style={{
                          color: themeMode === mode ? theme.primary : theme.secondaryText,
                          fontWeight: themeMode === mode ? '600' : 'normal',
                          fontSize: 12,
                        }}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Daily Reminders */}
          <NotificationPreferences userId={currentUser.id} />

          {/* Data & Privacy */}
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold' }}>Data & Privacy</Text>
            </View>
            
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 16 }}>
              <TouchableOpacity
                onPress={handleExportData}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="download" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Export Data</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="document-text" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Support */}
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold' }}>Support</Text>
            </View>
            
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 16 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="help-circle" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Help Center</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="mail" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Contact Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Rate App</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account */}
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold' }}>Account</Text>
            </View>
            
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="trash" size={20} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 16, marginLeft: 8 }}>Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Debug Section */}
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold' }}>Debug</Text>
            </View>
            
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 16 }}>
              <TouchableOpacity
                onPress={viewScheduledNotifications}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="notifications" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>View Scheduled Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={testNotification}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="send" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Test Notification</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/debug-logs')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="bug" size={20} color={theme.secondaryText} />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Error Logs</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetLocalDatabase}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="refresh" size={20} color="#ef4444" />
                  <Text style={{ color: theme.text, fontSize: 16, marginLeft: 8 }}>Reset Local Database</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}