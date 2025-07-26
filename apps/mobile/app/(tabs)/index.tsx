import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StreakCounter } from '../../components/StreakCounter';
import { EntryCard } from '../../components/EntryCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, JournalEntry, UserStats } from '../../services/api';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { useUserStore } from '../../stores/useUserStore';

export default function HomeScreen() {
  const {theme} = useAppSettingsStore();
  const { currentUser, loadUserFromStorage } = useUserStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, entriesData] = await Promise.all([
        apiService.getUserStats(currentUser.id),
        apiService.getJournalEntries(currentUser.id)
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
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleEntryPress = (entry: JournalEntry) => {
    // Navigate to entry detail/edit screen
    console.log('Entry pressed:', entry.journal_entry_id);
  };

  const goToNewEntry = () => {
    router.push('/(tabs)/new-entry');
  };

  const goToExplore = () => {
    router.push('/(tabs)/explore');
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
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Welcome back! 👋
          </Text>
          <Text style={{ color: theme.secondaryText, fontSize: 16 }}>
            Ready to capture today's moments?
          </Text>
        </View>

        {/* Streak Counter */}
        {stats && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <StreakCounter streak={stats.streak} size="large" />
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32, gap: 16 }}>
          <TouchableOpacity
            onPress={goToNewEntry}
            style={{
              backgroundColor: theme.primary,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#ec8320',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold', marginLeft: 8 }}>
              New Journal Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToExplore}
            style={{
              backgroundColor: theme.secondary,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'semibold', marginLeft: 8 }}>
              Explore
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Entries */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Recent Entries</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/journal')}>
              <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'medium' }}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentEntries.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {recentEntries.map((entry) => (
                <View key={entry.journal_entry_id || entry.created_at} style={{ marginBottom: 16 }}>
                  <EntryCard
                    entry={entry}
                    onPress={() => handleEntryPress(entry)}
                    size="medium"
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
              <Text style={{ color: theme.secondaryText, fontSize: 16, textAlign: 'center' }}>
                No entries yet! Start your journaling journey by creating your first entry.
              </Text>
            </View>
          )}
        </View>

        {/* Weekly Progress */}
        {stats && (
          <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>This Week</Text>
            <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.secondaryText, fontSize: 16, fontWeight: 'semibold' }}>Progress</Text>
                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'semibold' }}>
                  {stats.currentWeekEntries}/{stats.weeklyGoal}
                </Text>
              </View>
              <View style={{ backgroundColor: theme.border, borderRadius: 16, height: 8 }}>
                <View style={{ backgroundColor: theme.primary, borderRadius: 16, height: 8, width: `${Math.min((stats.currentWeekEntries / stats.weeklyGoal) * 100, 100)}%` }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}