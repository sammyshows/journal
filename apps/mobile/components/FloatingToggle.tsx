import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
type Mode = 'text' | 'voice' | 'mixed';

interface FloatingToggleProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function FloatingToggle({ currentMode, onModeChange }: FloatingToggleProps) {
  const { theme } = useAppSettingsStore()
  const modes: { key: Mode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'text', icon: 'document-text-outline', label: 'Text' },
    { key: 'voice', icon: 'mic-outline', label: 'Voice' },
    { key: 'mixed', icon: 'layers-outline', label: 'Mixed' },
  ];

  return (
    <View 
      style={{
        display: 'flex',
        backgroundColor: theme.surface,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8
      }}
    >
      {modes.map((mode) => {
        const isActive = currentMode === mode.key;
        return (
          <TouchableOpacity
            key={mode.key}
            onPress={() => onModeChange(mode.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              active: { scale: 0.95 },
              backgroundColor: isActive ? theme.primary : theme.surface,
            }}
          >
            <Ionicons
              name={mode.icon}
              size={16}
              color={isActive ? theme.surface : theme.secondaryText}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: 'medium',
                color: isActive ? theme.surface : theme.secondaryText,
              }}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}