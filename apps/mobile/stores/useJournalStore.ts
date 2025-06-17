import { create } from 'zustand';
import { apiService, JournalEntry } from '../services/api';

interface JournalStore {
  entries: JournalEntry[];
  isLoading: boolean;
  hasLoaded: boolean;
  setEntries: (entries: JournalEntry[]) => void;
  fetchEntries: () => Promise<void>;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  isLoading: false,
  hasLoaded: false,
  
  setEntries: (entries: JournalEntry[]) => {
    set({ entries });
  },
  
  fetchEntries: async () => {
    const { isLoading } = get();
    if (isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const entries = await apiService.getJournalEntries();
      set({ 
        entries, 
        isLoading: false, 
        hasLoaded: true 
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