import { create } from 'zustand';
import { apiService, JournalEntry } from '../services/api';

interface JournalStore {
  entries: JournalEntry[];
  isLoading: boolean;
  hasLoaded: boolean;
  currentUserId: string | null;
  setEntries: (entries: JournalEntry[]) => void;
  fetchEntries: (userId?: string) => Promise<void>;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  isLoading: false,
  hasLoaded: false,
  currentUserId: null,
  
  setEntries: (entries: JournalEntry[]) => {
    set({ entries });
  },
  
  fetchEntries: async (userId?: string) => {
    const { isLoading } = get();
    if (isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const entries = await apiService.getJournalEntries(userId);
      set({ 
        entries, 
        isLoading: false, 
        hasLoaded: true,
        currentUserId: userId || null
      });
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      set({ 
        isLoading: false, 
        hasLoaded: true 
      });
    }
  },
}));