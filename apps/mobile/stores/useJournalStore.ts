import { create } from 'zustand';
import * as apiService from '../services/api';
import { JournalEntry } from '../types';
import { getLocalEntries, deleteLocalEntry, deleteLocalEntriesBatch } from '../services/journalDatabase';

interface JournalStore {
  entries: JournalEntry[];
  isLoading: boolean;
  hasLoaded: boolean;
  currentUserId: string | null;
  syncInProgress: boolean;
  setEntries: (entries: JournalEntry[]) => void;
  fetchEntries: (userId?: string) => Promise<void>;
  addEntry: (entry: JournalEntry) => void;
  updateEntryInStore: (updatedEntry: JournalEntry) => void;
  getEntry: (entryId: string) => JournalEntry | undefined;
  setSyncInProgress: (inProgress: boolean) => void;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  isLoading: false,
  hasLoaded: false,
  currentUserId: null,
  syncInProgress: false,
  
  setEntries: (entries: JournalEntry[]) => {
    set({ entries });
  },
  
  fetchEntries: async (userId?: string) => {
    const { isLoading } = get();
    if (isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const [entries, localEntries] = await Promise.all([
        apiService.getJournalEntries(userId),
        getLocalEntries(userId || '')
      ]);

      // Cross-match and remove entries from local database that now exist on the server
      const remoteIds = new Set(entries.map(entry => entry.journal_entry_id));
      const duplicatesInLocal = localEntries.filter(localEntry => 
        remoteIds.has(localEntry.journal_entry_id)
      );

      // Delete duplicates from local database using batch operation
      if (duplicatesInLocal.length > 0) {
        try {
          const duplicateIds = duplicatesInLocal.map(entry => entry.journal_entry_id);
          await deleteLocalEntriesBatch(duplicateIds);
          console.log(`Cleaned up ${duplicatesInLocal.length} duplicate entries from local database`);
        } catch (error) {
          console.warn('Failed to batch remove duplicate entries:', error);
          // Fallback to individual deletions if batch fails
          for (const duplicate of duplicatesInLocal) {
            try {
              await deleteLocalEntry(duplicate.journal_entry_id);
            } catch (individualError) {
              console.warn(`Failed to remove duplicate entry ${duplicate.journal_entry_id}:`, individualError);
            }
          }
        }
      }

      // Get remaining local entries after cleanup (these are unsynced entries)
      const remainingLocalEntries = localEntries.filter(localEntry => 
        !remoteIds.has(localEntry.journal_entry_id)
      );

      // Convert local entries to JournalEntry format to match the interface
      const formattedLocalEntries: JournalEntry[] = remainingLocalEntries.map(localEntry => ({
        journal_entry_id: localEntry.journal_entry_id,
        user_id: localEntry.user_id,
        content: localEntry.content,
        timestamp: localEntry.timestamp,
        created_at: localEntry.timestamp,
        updated_at: localEntry.timestamp,
        unsynced: true // Add a flag to identify unsynced entries
      }));

      // Combine remote entries with remaining local entries
      const allEntries = [...entries, ...formattedLocalEntries];
      
      // Sort by timestamp (most recent first)
      allEntries.sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());

      console.log(`Loaded ${entries.length} remote entries and ${formattedLocalEntries.length} local unsynced entries`);

      set({ 
        entries: allEntries, 
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

  getEntry: (entryId: string) => {
    const { entries } = get();
    return entries.find(entry => entry.journal_entry_id === entryId);
  },
  
  addEntry: (entry: JournalEntry) => {
    const { entries } = get();
    const newEntries = [entry, ...entries];
    set({ entries: newEntries });
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

  setSyncInProgress: (inProgress: boolean) => {
    set({ syncInProgress: inProgress });
  },
}));