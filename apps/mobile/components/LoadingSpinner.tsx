import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function LoadingSpinner({ size = 'medium', color = '#ec8320' }: LoadingSpinnerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  const sizeMap = {
    small: 20,
    medium: 30,
    large: 40
  };

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="items-center justify-center">
      <Animated.View
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          borderWidth: 3,
          borderTopColor: color,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          borderRadius: sizeMap[size] / 2,
          transform: [{ rotate: spin }],
        }}
      />
    </View>
  );
}