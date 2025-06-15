import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StreakCounter } from '../../components/StreakCounter';
import { EntryCard } from '../../components/EntryCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, JournalEntry, UserStats } from '../../services/api';

export default function HomeScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, entriesData] = await Promise.all([
        apiService.getUserStats(),
        apiService.getJournalEntries()
      ]);
      setStats(statsData);
      setRecentEntries(entriesData.slice(0, 4)); // Show recent 4 entries
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleEntryPress = (entry: JournalEntry) => {
    // Navigate to entry detail/edit screen
    console.log('Entry pressed:', entry.journal_entry_id);
  };

  const handleNewEntry = () => {
    router.push('/journal/new');
  };

  const handleChatWithAI = () => {
    router.push('/(tabs)/assistant');
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
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </Text>
          <Text className="text-lg text-gray-600">
            Ready to capture today's moments?
          </Text>
        </View>

        {/* Streak Counter */}
        {stats && (
          <View className="px-6 mb-6">
            <StreakCounter streak={stats.streak} size="large" />
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-6 mb-8 space-y-4">
          <TouchableOpacity
            onPress={handleNewEntry}
            className="bg-primary-500 rounded-2xl p-4 flex-row items-center justify-center shadow-lg active:scale-95"
            style={{
              shadowColor: '#ec8320',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text className="text-white text-lg font-semibold ml-2">
              New Journal Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChatWithAI}
            className="bg-soft-300 rounded-2xl p-4 flex-row items-center justify-center shadow-sm active:scale-95"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#9c6c56" />
            <Text className="text-soft-700 text-lg font-semibold ml-2">
              Talk to AI Bestie
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Entries */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">Recent Entries</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/journal')}>
              <Text className="text-primary-500 font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          {recentEntries.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {recentEntries.map((entry) => (
                <View key={entry.journal_entry_id || entry.created_at} className="mb-4">
                  <EntryCard
                    entry={entry}
                    onPress={() => handleEntryPress(entry)}
                    size="medium"
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100">
              <Text className="text-4xl mb-4">📝</Text>
              <Text className="text-gray-600 text-center">
                No entries yet! Start your journaling journey by creating your first entry.
              </Text>
            </View>
          )}
        </View>

        {/* Weekly Progress */}
        {stats && (
          <View className="px-6 py-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">This Week</Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600">Progress</Text>
                <Text className="text-primary-500 font-semibold">
                  {stats.currentWeekEntries}/{stats.weeklyGoal}
                </Text>
              </View>
              <View className="bg-gray-200 rounded-full h-3">
                <View
                  className="bg-primary-500 rounded-full h-3"
                  style={{
                    width: `${Math.min((stats.currentWeekEntries / stats.weeklyGoal) * 100, 100)}%`
                  }}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}