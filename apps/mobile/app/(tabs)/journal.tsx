import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, JournalEntry } from '../../services/api';

interface GroupedEntry {
  date: string;
  dayName: string;
  relativeTime: string;
  entries: (JournalEntry & { emoji: string; tags: string[] })[];
}

const DUMMY_DATA: GroupedEntry[] = [
  {
    date: '23\nJUN',
    dayName: 'Friday',
    relativeTime: '2 days ago',
    entries: [
      {
        journal_entry_id: '1',
        content: 'Morning Workout Session',
        created_at: '2025-06-13T09:15:00Z',
        emoji: '💪',
        tags: ['#discipline', '#grind', '#exercise']
      },
      {
        journal_entry_id: '2',
        content: 'Team Meeting Reflections',
        created_at: '2025-06-13T14:30:00Z',
        emoji: '🤝',
        tags: ['#work', '#collaboration', '#growth']
      }
    ]
  },
  {
    date: '21\nJUN',
    dayName: 'Wednesday',
    relativeTime: '4 days ago',
    entries: [
      {
        journal_entry_id: '3',
        content: 'Creative Writing Session',
        created_at: '2025-06-11T19:45:00Z',
        emoji: '✍️',
        tags: ['#creativity', '#writing', '#mindfulness']
      }
    ]
  },
  {
    date: '18\nJUN',
    dayName: 'Sunday',
    relativeTime: '1 week ago',
    entries: [
      {
        journal_entry_id: '4',
        content: 'Weekend Nature Walk',
        created_at: '2025-06-08T16:20:00Z',
        emoji: '🌿',
        tags: ['#nature', '#peace', '#reflection']
      },
      {
        journal_entry_id: '5',
        content: 'Family Dinner Thoughts',
        created_at: '2025-06-08T20:00:00Z',
        emoji: '👨‍👩‍👧‍👦',
        tags: ['#family', '#gratitude', '#love']
      }
    ]
  },
  {
    date: '15\nMAY',
    dayName: 'Thursday',
    relativeTime: '1 month ago',
    entries: [
      {
        journal_entry_id: '6',
        content: 'Project Launch Success',
        created_at: '2025-05-15T11:30:00Z',
        emoji: '🚀',
        tags: ['#achievement', '#work', '#celebration']
      }
    ]
  }
];

export default function JournalScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedEntries] = useState<GroupedEntry[]>(DUMMY_DATA);

  const loadEntries = async () => {
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const handleNewEntry = () => {
    router.push('/(tabs)/new-entry');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f2937' }}>Journal</Text>
          <TouchableOpacity
            onPress={handleNewEntry}
            style={{
              padding: 12,
              backgroundColor: '#3b82f6',
              borderRadius: 50,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {groupedEntries.map((group, groupIndex) => (
          <View key={groupIndex} style={{ marginBottom: 32 }}>
            {/* Date Header */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              {/* Date Block */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#f8fafc',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 18 }}>
                  {group.date}
                </Text>
              </View>

              {/* Date Info */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 2 }}>
                  {group.dayName}
                </Text>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>
                  {group.relativeTime}
                </Text>
              </View>
            </View>

            {/* Entries for this date */}
            <View style={{ marginLeft: 76 }}>
              {group.entries.map((entry, entryIndex) => (
                <TouchableOpacity
                  key={entry.journal_entry_id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: entryIndex === group.entries.length - 1 ? 0 : 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {/* Entry Content */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>{entry.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                        {entry.content}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#9ca3af' }}>
                        {formatTime(entry.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Tags */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {entry.tags.map((tag, tagIndex) => (
                      <View
                        key={tagIndex}
                        style={{
                          backgroundColor: '#f1f5f9',
                          borderRadius: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Empty State */}
        {groupedEntries.length === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📔</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              No entries yet
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
              Start your journaling journey by creating your first entry
            </Text>
            <TouchableOpacity
              onPress={handleNewEntry}
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 50,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Create First Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}