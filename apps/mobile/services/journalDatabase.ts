import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { createJournalEntry, getJournalEntries } from './api/journal';
import { useUserStore } from '../stores/useUserStore';
import { useJournalStore } from '../stores/useJournalStore';
import { errorLogger } from './errorLogger';

// Database configuration
const DB_NAME = 'journal.db';

// Types
export interface LocalJournalEntry {
  journal_entry_id: string;
  user_id: string;
  content: string;
  timestamp: string;
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
        timestamp TEXT NOT NULL
      );
    `);
    
    // Create indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON entries(timestamp);
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

    const timestamp = new Date().toISOString();

    await db!.runAsync(
      'INSERT INTO entries (journal_entry_id, user_id, content, timestamp) VALUES (?, ?, ?, ?)',
      [data.journal_entry_id, data.userId, data.content, timestamp]
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
      'SELECT * FROM entries WHERE user_id = ? ORDER BY timestamp DESC',
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
 * Delete multiple entries from the local database in a single transaction
 * More efficient than calling deleteLocalEntry multiple times
 */
export const deleteLocalEntriesBatch = dbFunctionWrapper(async (journal_entry_ids: string[]): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    if (journal_entry_ids.length === 0) {
      return;
    }

    // Create placeholders for the IN clause
    const placeholders = journal_entry_ids.map(() => '?').join(',');
    const query = `DELETE FROM entries WHERE journal_entry_id IN (${placeholders})`;
    
    const result = await db!.runAsync(query, journal_entry_ids);
    
    console.log(`Batch deleted ${result.changes} entries from local database`);
  } catch (error) {
    console.warn('Failed to batch delete entries:', error);
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

/**
 * Reset the local database by clearing all data
 */
export const resetLocalDatabase = dbFunctionWrapper(async (): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    // Drop the entries table
    await db!.execAsync('DROP TABLE IF EXISTS entries');
    
    // Recreate the table
    await db.execAsync(`
      CREATE TABLE entries (
        journal_entry_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);
    
    // Recreate indexes
    // await db.execAsync(`
    //   CREATE INDEX IF NOT EXISTS idx_timestamp ON entries(timestamp);
    // `);

    console.log('Local database has been reset successfully');
  } catch (error) {
    console.warn('Failed to reset local database:', error);
    throw error;
  }
});

export async function syncUnsyncedEntries() {
  const { syncInProgress, setSyncInProgress, fetchEntries } = useJournalStore.getState();
  
  try {
    // Check if sync is already in progress
    if (syncInProgress) {
      errorLogger.info('Sync already in progress, skipping...', 'syncUnsyncedEntries');
      return;
    }

    setSyncInProgress(true);
    errorLogger.info('Starting sync process', 'syncUnsyncedEntries');

    const userId = useUserStore.getState().currentUser?.id;
    if (!userId) {
      errorLogger.warn('No user ID available for sync', 'syncUnsyncedEntries');
      return;
    }

    errorLogger.info(`Syncing for user: ${userId}`, 'syncUnsyncedEntries');

    const [localEntries, remoteEntries] = await Promise.all([
      getLocalEntries(userId),
      getJournalEntries(userId),
    ]);

    const remoteIds = new Set(remoteEntries.map(e => e.journal_entry_id));
    const unsynced = localEntries.filter(local => !remoteIds.has(local.journal_entry_id));

    errorLogger.info(`Found ${unsynced.length} unsynced entries`, 'syncUnsyncedEntries');

    let successfulSyncs = 0;

    for (const entry of unsynced) {
      try {
        errorLogger.info(`Syncing entry: ${entry.journal_entry_id}`, 'syncUnsyncedEntries');

        await createJournalEntry(
          entry.journal_entry_id,
          entry.content,
          entry.user_id,
          entry.timestamp // preserve original user timestamp
        );

        // Delete the successfully synced entry from local database
        await deleteLocalEntry(entry.journal_entry_id);
        errorLogger.info(`Successfully synced and removed from local DB: ${entry.journal_entry_id}`, 'syncUnsyncedEntries');
        successfulSyncs++;

      } catch (syncError) {
        errorLogger.error(`Failed to sync entry ${entry.journal_entry_id}`, 'syncUnsyncedEntries', syncError as Error);
        // Continue with other entries even if one fails
      }
    }

    if (successfulSyncs > 0) {
      console.log(`✅ Successfully synced ${successfulSyncs} entries.`);
      
      // Refetch entries from the server to update the UI with the latest data
      console.log('Refetching entries after successful sync...');
      await fetchEntries(userId);
    }

    setSyncInProgress(false);
  } catch (err) {
    errorLogger.error('Error syncing unsynced entries', 'syncUnsyncedEntries', err as Error);
  } finally {
    setSyncInProgress(false);
  }
}