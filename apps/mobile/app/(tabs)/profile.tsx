import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StreakCounter } from '../../components/StreakCounter';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, UserStats } from '../../services/api';

export default function ProfileScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('8:00 PM');

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const data = await apiService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderToggle = (value: boolean) => {
    setRemindersEnabled(value);
    // In a real app, this would save the setting
    console.log('Reminders enabled:', value);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    // In a real app, this would apply the theme
    console.log('Dark mode:', value);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Profile</Text>
          <Text className="text-gray-600">Manage your journaling experience</Text>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View className="px-6 mb-8">
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Your Journey
              </Text>
              
              <View className="flex-row items-center justify-between mb-4">
                <StreakCounter streak={stats.streak} size="medium" />
                <View className="flex-1 ml-6">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Total Entries</Text>
                    <Text className="font-semibold text-gray-900">{stats.totalEntries}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">This Week</Text>
                    <Text className="font-semibold text-gray-900">
                      {stats.currentWeekEntries}/{stats.weeklyGoal}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-gray-100 rounded-full h-2">
                <View
                  className="bg-primary-500 rounded-full h-2"
                  style={{
                    width: `${Math.min((stats.currentWeekEntries / stats.weeklyGoal) * 100, 100)}%`
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Settings Sections */}
        <View className="px-6 space-y-6">
          {/* Preferences */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Preferences</Text>
            </View>
            
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="moon" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Dark Mode</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: '#e5e7eb', true: '#fde9d3' }}
                  thumbColor={darkMode ? '#ec8320' : '#9ca3af'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="notifications" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Daily Reminders</Text>
                </View>
                <Switch
                  value={remindersEnabled}
                  onValueChange={handleReminderToggle}
                  trackColor={{ false: '#e5e7eb', true: '#fde9d3' }}
                  thumbColor={remindersEnabled ? '#ec8320' : '#9ca3af'}
                />
              </View>

              {remindersEnabled && (
                <TouchableOpacity
                  onPress={handleReminderTimePress}
                  className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={20} color="#6b7280" />
                    <Text className="text-gray-900 ml-3">Reminder Time</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-primary-500 mr-2">{reminderTime}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ec8320" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Data & Privacy */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Data & Privacy</Text>
            </View>
            
            <View className="px-6 py-4 space-y-4">
              <TouchableOpacity
                onPress={handleExportData}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="download" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Export Data</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="document-text" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Support */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Support</Text>
            </View>
            
            <View className="px-6 py-4 space-y-4">
              <TouchableOpacity className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="help-circle" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Help Center</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="mail" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Contact Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3">Rate App</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Account</Text>
            </View>
            
            <View className="px-6 py-4">
              <TouchableOpacity
                onPress={handleDeleteAccount}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="trash" size={20} color="#ef4444" />
                  <Text className="text-red-500 ml-3">Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}