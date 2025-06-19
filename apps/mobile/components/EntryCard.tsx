import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { JournalEntry } from '../services/api';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function EntryCard({ entry, onPress, size = 'medium' }: EntryCardProps) {
  const { theme } = useAppSettingsStore()
  const sizeClasses = {
    small: 32,
    medium: 40,
    large: 32
  };

  const textSizeClasses = {
    small: 12,
    medium: 14,
    large: 16
  };

  const emojiSizeClasses = {
    small: 24,
    medium: 32,
    large: 40
  };

  // Generate emoji based on content sentiment (simple approach)
  const getEmoji = (content: string): string => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('happy') || lowerContent.includes('joy') || lowerContent.includes('excited')) return '😊';
    if (lowerContent.includes('sad') || lowerContent.includes('down') || lowerContent.includes('upset')) return '😢';
    if (lowerContent.includes('angry') || lowerContent.includes('frustrated')) return '😤';
    if (lowerContent.includes('peaceful') || lowerContent.includes('calm') || lowerContent.includes('serene')) return '😌';
    if (lowerContent.includes('work') || lowerContent.includes('project') || lowerContent.includes('meeting')) return '💼';
    if (lowerContent.includes('family') || lowerContent.includes('love') || lowerContent.includes('together')) return '❤️';
    if (lowerContent.includes('exercise') || lowerContent.includes('run') || lowerContent.includes('gym')) return '💪';
    if (lowerContent.includes('food') || lowerContent.includes('dinner') || lowerContent.includes('lunch')) return '🍽️';
    if (lowerContent.includes('travel') || lowerContent.includes('vacation') || lowerContent.includes('trip')) return '✈️';
    return '📝'; // Default journal emoji
  };

  // Extract a summary from the content (first 30 characters + ellipsis)
  const getSummary = (content: string): string => {
    if (content.length <= 30) return content;
    return content.substring(0, 30) + '...';
  };

  // Extract tags from content (simple keyword extraction)
  const getTags = (content: string): string[] => {
    const keywords = [
      'work', 'family', 'love', 'happy', 'sad', 'excited', 'grateful', 
      'peaceful', 'exercise', 'food', 'travel', 'friends', 'home', 
      'nature', 'reading', 'music', 'learning', 'creative', 'stressed'
    ];
    
    const lowerContent = content.toLowerCase();
    const foundTags = keywords.filter(keyword => lowerContent.includes(keyword));
    return foundTags.slice(0, 3); // Max 3 tags
  };

  const emoji = getEmoji(entry.content);
  const summary = getSummary(entry.content);
  const tags = getTags(entry.content);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ 
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: emojiSizeClasses[size], marginBottom: 8 }}>{emoji}</Text>
        <Text style={{ fontSize: textSizeClasses[size], fontWeight: 'semibold', color: theme.text, marginBottom: 8 }}>
          {summary}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={{ backgroundColor: theme.emotionTag, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 }}>
              <Text style={{ fontSize: 12, color: theme.surface, fontWeight: 'medium' }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: textSizeClasses[size], color: theme.secondaryText, marginTop: 'auto' }}>
          {new Date(entry.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}