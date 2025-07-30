import { create } from 'zustand';
import * as apiService from '../services/api';
import { JournalEntry } from '../types';

interface JournalStore {
  entries: JournalEntry[];
  isLoading: boolean;
  hasLoaded: boolean;
  currentUserId: string | null;
  setEntries: (entries: JournalEntry[]) => void;
  fetchEntries: (userId?: string) => Promise<void>;
  updateEntryInStore: (updatedEntry: JournalEntry) => void;
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
  
  updateEntryInStore: (updatedEntry: JournalEntry) => {
    const { entries } = get();
    const updatedEntries = entries.map(entry => 
      entry.journal_entry_id === updatedEntry.journal_entry_id 
        ? updatedEntry 
        : entry
    );
    set({ entries: updatedEntries });
  },
}));