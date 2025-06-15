import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Mode = 'text' | 'voice' | 'mixed';

interface FloatingToggleProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function FloatingToggle({ currentMode, onModeChange }: FloatingToggleProps) {
  const modes: { key: Mode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'text', icon: 'document-text-outline', label: 'Text' },
    { key: 'voice', icon: 'mic-outline', label: 'Voice' },
    { key: 'mixed', icon: 'layers-outline', label: 'Mixed' },
  ];

  return (
    <View 
      className="bg-white rounded-full shadow-lg border border-gray-100 p-1 flex-row items-center"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {modes.map((mode) => {
        const isActive = currentMode === mode.key;
        return (
          <TouchableOpacity
            key={mode.key}
            onPress={() => onModeChange(mode.key)}
            className={`px-4 py-2 rounded-full flex-row items-center space-x-2 active:scale-95 ${
              isActive ? 'bg-primary-500' : 'bg-transparent'
            }`}
          >
            <Ionicons
              name={mode.icon}
              size={16}
              color={isActive ? 'white' : '#6b7280'}
            />
            <Text
              className={`text-sm font-medium ${
                isActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}