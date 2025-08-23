import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { JournalEntry } from '../../services/api';
import { useJournalStore } from '../../stores/useJournalStore';
import { useUserStore } from '../../stores/useUserStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';

interface GroupedEntry {
  dateNumber: string;
  dateMonth: string;
  dayName: string;
  relativeTime: string;
  entries: (JournalEntry)[];
}

function groupEntriesByDate(entries: JournalEntry[]): GroupedEntry[] {
  const grouped: { [key: string]: GroupedEntry } = {};
  
  entries.forEach(entry => {
    const date = new Date(entry.timestamp);
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
    
    grouped[dateKey].entries.push(entry);
  });
  
  return Object.values(grouped).sort((a, b) => 
    new Date(b.entries[0].timestamp).getTime() - new Date(a.entries[0].timestamp).getTime()
  );
}

export default function JournalScreen() {
  const { theme } = useAppSettingsStore();
  const { currentUser } = useUserStore();
  const { entries, isLoading, hasLoaded, fetchEntries } = useJournalStore();
  const [refreshing, setRefreshing] = useState(false);
  const [pressedEntry, setPressedEntry] = useState<string | null>(null);

  const insets = useSafeAreaInsets()
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const groupedEntries = groupEntriesByDate(entries);

  useEffect(() => {
    if (currentUser && !hasLoaded) {
      fetchEntries(currentUser.id);
    }
  }, [currentUser, hasLoaded, fetchEntries]);

  useEffect(() => {
    // Create a smooth speed-varying spinning animation
    const createSpinAnimation = () => {
      return Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1.0), // Smooth acceleration/deceleration
          useNativeDriver: true,
        })
      );
    };

    // Create a light pulsing animation for the text
    const createPulseAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const spinAnimation = createSpinAnimation();
    const pulseAnimation = createPulseAnimation();
    
    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinAnim, pulseAnim]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEntries(currentUser.id);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ 
      flex: 1, 
      paddingTop: insets.top, 
      paddingBottom: 0,
      backgroundColor: theme.background
    }}>

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
            <Text style={{ fontSize: 36, fontWeight: '200', color: theme.text }}>Your Entries</Text>
          </View>
        </View>
        {groupedEntries.map((group, groupIndex) => (
          <View key={groupIndex} style={{ marginBottom: 32 }}>
            {/* Date Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              {/* Date Block */}
              <View
                style={{
                  width: 45,
                  height: 60,
                  backgroundColor: theme.surface,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  flexDirection: 'column',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, textAlign: 'center', lineHeight: 28 }}>
                  {group.dateNumber}
                </Text>
                <Text style={{ fontSize: 12, color: theme.secondaryText, textAlign: 'center', lineHeight: 14, fontWeight: '600' }}>
                  {group.dateMonth}
                </Text>
              </View>

              {/* Date Info */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                  {group.dayName }
                </Text>
                <Text style={{ fontSize: 14, color: theme.secondaryText, textTransform: 'uppercase', fontWeight: '600' }}>
                  {group.relativeTime}
                </Text>
              </View>
            </View>

            {/* Entries for this date */}
            <View style={{ marginLeft: 32 }}>
              {group.entries.map((entry, entryIndex) => (
                <Animated.View
                  key={entry.journal_entry_id}
                  style={{
                    transform: [{
                      scale: pressedEntry === entry.journal_entry_id ? 0.98 : 1,
                    }],
                  }}
                >
                  <TouchableOpacity
                    onPressIn={() => setPressedEntry(entry.journal_entry_id || null)}
                    onPressOut={() => setPressedEntry(null)}
                    onPress={() => {
                      setPressedEntry(null);
                      // Don't navigate to unsynced entries
                      if (entry.unsynced) {
                        return;
                      }
                      router.push({
                        pathname: '/journal-entry',
                        params: { id: entry.journal_entry_id }
                      });
                    }}
                    style={{
                      backgroundColor: theme.surface,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: entryIndex === group.entries.length - 1 ? 0 : 12,
                      shadowColor: theme.border,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.12,
                      shadowRadius: 50,
                      elevation: 4,
                      // Add visual indication for unsynced entries
                      borderWidth: entry.unsynced ? 1 : 0,
                      borderColor: entry.unsynced ? theme.primary : 'transparent',
                      opacity: entry.unsynced ? 0.7 : 1,
                    }}
                  >
                  {/* Entry Content */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>{entry.emoji || '📝'}</Text>
                    <View style={{ flex: 1 }}>
                      {entry.unsynced ? (
                        // Unsynced entry display
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Animated.Text style={{ 
                              fontSize: 14, 
                              fontWeight: '600', 
                              color: theme.text, 
                              marginRight: 8,
                              opacity: pulseAnim
                            }}>
                              Summarising...
                            </Animated.Text>
                            <Animated.View
                              style={{
                                transform: [{
                                  rotate: spinAnim.interpolate({
                                    inputRange: [0, 0.1, 0.5, 0.9, 1],
                                    outputRange: ['0deg', '90deg', '540deg', '810deg', '900deg'],
                                  }),
                                }],
                              }}
                            >
                              <Ionicons name="sync" size={12} color={theme.primary} />
                            </Animated.View>
                          </View>
                          <Text 
                            style={{ 
                              fontSize: 12, 
                              color: theme.secondaryText, 
                              lineHeight: 16,
                              marginBottom: 4
                            }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {entry.content}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.secondaryText }}>
                            {formatTime(entry.timestamp)}
                          </Text>
                        </View>
                      ) : (
                        // Regular synced entry display
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                            {entry.title}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.secondaryText }}>
                            {formatTime(entry.timestamp)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Tags */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {entry.tags?.map((tag: string, tagIndex: number) => (
                      // Show regular tags for synced entries
                      <View
                        key={tagIndex}
                        style={{
                          backgroundColor: theme.emotionTag,
                          borderRadius: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: theme.text, fontWeight: '500' }}>
                          {tag}
                        </Text>
                      </View>
                      ))}
                  </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        ))}

        {/* Empty State */}
        {groupedEntries.length === 0 && hasLoaded && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📔</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              No entries yet
            </Text>
            <Text style={{ fontSize: 14, color: theme.secondaryText, textAlign: 'center', marginBottom: 24 }}>
              Start your journaling journey by creating your first entry
            </Text>
            <TouchableOpacity
              onPress={handleNewEntry}
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 50,
                shadowColor: theme.border,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: theme.surface, fontWeight: '600' }}>Create First Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}