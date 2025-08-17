import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { createJournalEntry, getJournalEntries } from './api/journal';
import { useUserStore } from '../stores/useUserStore';

// Database configuration
const DB_NAME = 'journal.db';
const DB_VERSION = 1;

// Types
export interface LocalJournalEntry {
  journal_entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface NewEntryData {
  journal_entry_id: string;
  userId: string;
  content: string;
}

// Database instance
let db: any | null = null;

// Fix the wrapper to preserve function signatures
const dbFunctionWrapper = <T extends (...args: any[]) => any>(func: T): T => {
  return ((...args: Parameters<T>) => {
    // Return early if we're on web
    if (Platform.OS === 'web') {
      console.warn("SQLite is not supported on web.");
      return Promise.resolve();
    }

    // Initialize the database if it's not already initialized
    if (!db) {
      return initDB().then(() => func(...args));
    }

    // Call the function
    return func(...args);
  }) as T;
};

/**
 * Initialize the database and create tables if they don't exist
 */
export async function initDB(): Promise<void> {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync(DB_NAME, {
        enableChangeListener: false,
        useNewConnection: false,
      });
    }

    // Create the entries table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS entries (
        journal_entry_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Create an index on created_at for faster sorting
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_created_at ON entries(created_at);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Add a new journal entry to the local database
 */
export const addEntry = dbFunctionWrapper(async (data: NewEntryData): Promise<string> => {
  try {
    if (!db) {
      await initDB();
    }

    const created_at = new Date().toISOString();

    await db!.runAsync(
      'INSERT INTO entries (journal_entry_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
      [data.journal_entry_id, data.userId, data.content, created_at]
    );

    console.log('Entry added successfully:', data.journal_entry_id);
    return data.journal_entry_id;
  } catch (error) {
    console.warn('Failed to add entry:', error);
    throw error;
  }
});

/**
 * Get all entries (both synced and unsynced) for local display
 */
export const getLocalEntries = dbFunctionWrapper(async (userId: string): Promise<LocalJournalEntry[]> => {
  try {
    if (!db) {
      await initDB();
    }

    const result = await db!.getAllAsync(
      'SELECT * FROM entries WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return result as LocalJournalEntry[];
  } catch (error) {
    console.warn('Failed to get all entries:', error);
    return [];
  }
});

/**
 * Delete an entry from the local database
 * Use with caution - only for entries that haven't been synced
 */
export const deleteLocalEntry = dbFunctionWrapper(async (journal_entry_id: string): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    const result = await db!.runAsync('DELETE FROM entries WHERE journal_entry_id = ?', [journal_entry_id]);
    
    if (result.changes === 0) {
      console.warn('No entry found with journal_entry_id:', journal_entry_id);
    } else {
      console.log('Entry deleted:', journal_entry_id);
    }
  } catch (error) {
    console.warn('Failed to delete entry:', error);
    throw error;
  }
});

/**
 * Close the database connection
 */
export const closeDB = dbFunctionWrapper(async (): Promise<void> => {
  try {
    if (db) {
      await db.closeAsync();
      db = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.warn('Failed to close database:', error);
  }
});

export async function syncUnsyncedEntries() {
  try {
    const userId = useUserStore.getState().currentUser?.id;

    const [localEntries, remoteEntries] = await Promise.all([
      getLocalEntries(userId),
      getJournalEntries(userId),
    ]);

    const remoteIds = new Set(remoteEntries.map(e => e.journal_entry_id));

    const unsynced = localEntries.filter(local => !remoteIds.has(local.journal_entry_id));

    console.log('[syncUnsyncedEntries] unsynced entry count', unsynced.length);

    for (const entry of unsynced) {
      console.log(`Syncing entry: ${entry.journal_entry_id}`);

      await createJournalEntry(
        entry.journal_entry_id,
        entry.content,
        entry.user_id,
        entry.created_at // preserve original timestamp
      );
    }

    if (unsynced.length > 0) {
      console.log(`✅ Synced ${unsynced.length} entries.`);
    }
  } catch (err) {
    console.warn('Error syncing unsynced entries:', err);
  }
}