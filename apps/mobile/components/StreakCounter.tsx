import React from 'react';
import { View, Text } from 'react-native';

interface StreakCounterProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
}

export function StreakCounter({ streak, size = 'medium' }: StreakCounterProps) {
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  const labelSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <View 
      className={`${sizeClasses[size]} bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl items-center justify-center shadow-lg`}
      style={{
        shadowColor: '#ec8320',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View className="flex-row items-center">
        <Text className="text-3xl mr-2">🔥</Text>
        <Text className={`${textSizeClasses[size]} font-bold text-white`}>
          {streak}
        </Text>
      </View>
      <Text className={`${labelSizeClasses[size]} text-primary-100 font-medium mt-1`}>
        {streak === 1 ? 'day streak' : 'day streak'}
      </Text>
    </View>
  );
}