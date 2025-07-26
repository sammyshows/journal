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
  currentUser: predefinedUsers[2], // Default to Test user
  users: predefinedUsers,
  
  setCurrentUser: async (user: User) => {
    await AsyncStorage.setItem('currentUserId', user.id);
    set({ currentUser: user });
  },
  
  loadUserFromStorage: async () => {
    const savedUserId = await AsyncStorage.getItem('currentUserId');
    if (savedUserId) {
      const user = predefinedUsers.find(u => u.id === savedUserId);
      if (user) {
        set({ currentUser: user });
      }
    }
  }
})); 