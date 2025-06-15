import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { JournalEntry } from '../services/api';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function EntryCard({ entry, onPress, size = 'medium' }: EntryCardProps) {
  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-40 h-40',
    large: 'w-full h-32'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const emojiSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
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
      className={`${sizeClasses[size]} bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-95`}
      style={{ 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-1">
        <Text className={`${emojiSizeClasses[size]} mb-2`}>{emoji}</Text>
        <Text className={`${textSizeClasses[size]} font-semibold text-gray-800 mb-1`}>
          {summary}
        </Text>
        <View className="flex-row flex-wrap gap-1 mb-2">
          {tags.slice(0, 2).map((tag, index) => (
            <View key={index} className="bg-primary-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-primary-700 font-medium">
                {tag}
              </Text>
            </View>
          ))}
        </View>
        <Text className={`${textSizeClasses[size]} text-gray-500 mt-auto`}>
          {new Date(entry.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}