import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TabBarAddButton from '@/components/TabBarAddButton';
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';
import { View } from 'react-native';

export default function TabLayout() {
  const { theme } = useAppSettingsStore();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.secondaryText,
          headerShown: false,
          tabBarStyle: {
            overflow: 'visible',
            backgroundColor: theme.surface,
            paddingBottom: 8,
            paddingTop: 8,
            height: 80,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30,
            shadowColor: '#000',
            borderTopWidth: 0,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Journal',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="new-entry"
          options={{
            title: '',
            tabBarLabel: () => null,
            tabBarIcon: ({ focused }) => <TabBarAddButton focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'AI Chat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
