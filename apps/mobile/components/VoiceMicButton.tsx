import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';

interface VoiceMicButtonProps {
  isRecording: boolean;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function VoiceMicButton({ isRecording, onPress, size = 'medium' }: VoiceMicButtonProps) {
  const { theme } = useAppSettingsStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const sizeClasses = {
    small: 48,  // w-12 h-12
    medium: 64, // w-16 h-16
    large: 80   // w-20 h-20
  };

  const iconSizes = {
    small: 20,
    medium: 28,
    large: 36
  };

  useEffect(() => {
    if (isRecording) {
      // Pulsing animation when recording
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Glow animation when recording
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    } else {
      // Reset animations when not recording
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording, pulseAnim, glowAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      activeOpacity={0.95}
    >
      <Animated.View
        style={{
          width: sizeClasses[size],
          height: sizeClasses[size],
          borderRadius: sizeClasses[size] / 2,
          backgroundColor: "#ef4444",
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={iconSizes[size]}
          color="white"
        />
      </Animated.View>
    </TouchableOpacity>
  );
}