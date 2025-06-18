import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const TabBarAddButton = () => {
  const scale = useSharedValue(1);
  const router = useRouter();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 150 })
    );

    // 👇 Navigate manually to the "new-entry" route
    router.push('/new-entry');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        zIndex: 10,
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: '#035afc',
            width: 64,
            height: 64,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 12,
          },
          animatedStyle,
        ]}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Animated.View>
    </Pressable>
  );
};

export default TabBarAddButton;
