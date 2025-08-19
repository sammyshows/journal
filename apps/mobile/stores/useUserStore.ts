import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  color: string;
}

interface UserStore {
  currentUser: User;
  users: User[];
  loading: boolean;
  setCurrentUser: (user: User) => void;
  loadUserFromStorage: () => Promise<void>;
}

const predefinedUsers: User[] = [
  {
    id: '123e9876-e89b-12d3-a456-400014174000',
    name: 'Celine',
    color: '#ec8320' // Orange
  },
  {
    id: '123e9876-e89b-12d3-a456-426614174000',
    name: 'Sam',
    color: '#3b82f6' // Blue
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test',
    color: '#10b981' // Green
  }
];

export const useUserStore = create<UserStore>((set) => ({
  currentUser: predefinedUsers[2],
  users: predefinedUsers,
  loading: true,

  setCurrentUser: async (user: User) => {
    await AsyncStorage.setItem('currentUserId', user.id);
    set({ currentUser: user });
    
    // Refresh notifications for the new user (dynamic import to avoid circular dependency)
    try {
      const notificationService = (await import('../services/notificationService')).default;
      await notificationService.initializeNotifications(user.id);
    } catch (error) {
      console.error('Error initializing notifications for new user:', error);
    }
  },

  loadUserFromStorage: async () => {
    try {
      const savedUserId = await AsyncStorage.getItem('currentUserId');
      if (savedUserId) {
        const user = predefinedUsers.find(u => u.id === savedUserId);
        if (user) {
          set({ currentUser: user });
        }
      }
    } catch(err) {
      console.log('Error loading user from storage:', err)
    } finally {
      set({ loading: false });
    }
  }
}));