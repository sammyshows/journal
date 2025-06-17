import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { JournalEntry } from '../../services/api';
import { useJournalStore } from '../../stores/useJournalStore';

interface GroupedEntry {
  dateNumber: string;
  dateMonth: string;
  dayName: string;
  relativeTime: string;
  entries: (JournalEntry & { emoji: string; tags: string[] })[];
}

const PASTEL_COLORS = [
  '#E6F3FF', // Soft blue
  '#F0E6FF', // Soft purple
  '#E6FFFA', // Soft mint
  '#FFF0E6', // Soft peach
  '#F0FFE6', // Soft sage
];

const DEFAULT_EMOJIS = ['📝', '💭', '🌟', '💡', '🎯', '🌱', '🔥', '⚡', '🌈', '🎨'];
const DEFAULT_TAGS = ['reflection', 'thoughts', 'journey', 'growth', 'mindfulness'];

function getRandomEmoji(): string {
  return DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
}

function getRandomTags(): string[] {
  const shuffled = [...DEFAULT_TAGS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
}

function groupEntriesByDate(entries: JournalEntry[]): GroupedEntry[] {
  const grouped: { [key: string]: GroupedEntry } = {};
  
  entries.forEach(entry => {
    const date = new Date(entry.created_at);
    const dateKey = date.toDateString();
    
    if (!grouped[dateKey]) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let relativeTime = '';
      if (diffDays === 1) {
        relativeTime = 'Yesterday';
      } else if (diffDays < 7) {
        relativeTime = `${diffDays} days ago`;
      } else if (diffDays < 30) {
        relativeTime = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      } else {
        relativeTime = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
      }
      
      grouped[dateKey] = {
        dateNumber: date.getDate().toString(),
        dateMonth: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        relativeTime,
        entries: []
      };
    }
    
    grouped[dateKey].entries.push({
      ...entry,
      emoji: getRandomEmoji(),
      tags: getRandomTags()
    });
  });
  
  return Object.values(grouped).sort((a, b) => 
    new Date(b.entries[0].created_at).getTime() - new Date(a.entries[0].created_at).getTime()
  );
}

export default function JournalScreen() {
  const { entries, isLoading, hasLoaded, fetchEntries } = useJournalStore();
  const [refreshing, setRefreshing] = useState(false);
  
  const groupedEntries = groupEntriesByDate(entries);

  useEffect(() => {
    if (!hasLoaded) {
      fetchEntries();
    }
  }, [hasLoaded, fetchEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
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

  if (isLoading && !hasLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>

      {/* Timeline */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 10, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <Text style={{ fontSize: 36, fontWeight: '200', color: '#1f2937' }}>Your Entries</Text>
          </View>
        </View>
        {groupedEntries.map((group, groupIndex) => (
          <View key={groupIndex} style={{ marginBottom: 32 }}>
            {/* Date Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
                  flexDirection: 'column',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 28 }}>
                  {group.dateNumber}
                </Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 14 }}>
                  {group.dateMonth}
                </Text>
              </View>

              {/* Date Info */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 2 }}>
                  {group.dayName }
                </Text>
                <Text style={{ fontSize: 14, color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>
                  {group.relativeTime}
                </Text>
              </View>
            </View>

            {/* Entries for this date */}
            <View style={{ marginLeft: 32 }}>
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
                        {entry.title}
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
                          backgroundColor: PASTEL_COLORS[entryIndex + tagIndex % PASTEL_COLORS.length],
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
        {groupedEntries.length === 0 && hasLoaded && (
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