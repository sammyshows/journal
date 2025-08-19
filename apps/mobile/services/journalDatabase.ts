import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { createJournalEntry, getJournalEntries } from './api/journal';
import { useUserStore } from '../stores/useUserStore';
import { useJournalStore } from '../stores/useJournalStore';

// Database configuration
const DB_NAME = 'journal.db';
const DB_VERSION = 2; // Incremented for timestamp column migration

// Types
export interface LocalJournalEntry {
  journal_entry_id: string;
  user_id: string;
  content: string;
  timestamp: string;
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
 * Check if a column exists in a table
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
    return result.some((column: any) => column.name === columnName);
  } catch (error) {
    console.warn(`Error checking if column ${columnName} exists:`, error);
    return false;
  }
}

/**
 * Get the current database schema version
 */
async function getDatabaseVersion(): Promise<number> {
  try {
    const result = await db.getAllAsync('PRAGMA user_version');
    return result[0]?.user_version || 0;
  } catch (error) {
    console.warn('Error getting database version:', error);
    return 0;
  }
}

/**
 * Set the database schema version
 */
async function setDatabaseVersion(version: number): Promise<void> {
  try {
    await db.execAsync(`PRAGMA user_version = ${version}`);
  } catch (error) {
    console.warn('Error setting database version:', error);
    throw error;
  }
}

/**
 * Migrate database from version 1 to version 2 (add timestamp column)
 */
async function migrateToV2(): Promise<void> {
  try {
    console.log('Migrating database to version 2...');
    
    // Check if timestamp column already exists
    const hasTimestamp = await columnExists('entries', 'timestamp');
    
    if (!hasTimestamp) {
      // Add the timestamp column
      await db.execAsync(`
        ALTER TABLE entries ADD COLUMN timestamp TEXT;
      `);
      
      // Set timestamp to created_at for existing entries (preserve original time)
      await db.execAsync(`
        UPDATE entries SET timestamp = created_at WHERE timestamp IS NULL;
      `);
      
      // Make timestamp NOT NULL after setting values
      // Note: SQLite doesn't support ALTER COLUMN, so we'll handle null checks in code
      
      console.log('Added timestamp column and populated with created_at values');
    }
    
    // Create index on timestamp for faster sorting
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON entries(timestamp);
    `);
    
    console.log('Database migration to v2 completed');
  } catch (error) {
    console.error('Error migrating database to v2:', error);
    throw error;
  }
}

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  const currentVersion = await getDatabaseVersion();
  console.log(`Current database version: ${currentVersion}, target version: ${DB_VERSION}`);
  
  if (currentVersion < 2) {
    await migrateToV2();
  }
  
  // Update to current version
  if (currentVersion < DB_VERSION) {
    await setDatabaseVersion(DB_VERSION);
    console.log(`Database updated to version ${DB_VERSION}`);
  }
}

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

    // Create the entries table if it doesn't exist (for new installations)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS entries (
        journal_entry_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Run migrations to update existing databases
    await runMigrations();
    
    // Create indexes
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

    const now = new Date().toISOString();
    const timestamp = now; // User-editable timestamp (when they saved it)
    const created_at = now; // Audit timestamp (when record was created)

    // Check if timestamp column exists (for migration safety)
    const hasTimestamp = await columnExists('entries', 'timestamp');
    
    if (hasTimestamp) {
      await db!.runAsync(
        'INSERT INTO entries (journal_entry_id, user_id, content, timestamp, created_at) VALUES (?, ?, ?, ?, ?)',
        [data.journal_entry_id, data.userId, data.content, timestamp, created_at]
      );
    } else {
      // Fallback for databases that haven't been migrated yet
      await db!.runAsync(
        'INSERT INTO entries (journal_entry_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
        [data.journal_entry_id, data.userId, data.content, created_at]
      );
    }

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

    // Check if timestamp column exists
    const hasTimestamp = await columnExists('entries', 'timestamp');
    
    let result;
    if (hasTimestamp) {
      result = await db!.getAllAsync(
        'SELECT * FROM entries WHERE user_id = ? ORDER BY timestamp DESC',
        [userId]
      );
    } else {
      // Fallback to created_at for non-migrated databases
      result = await db!.getAllAsync(
        'SELECT *, created_at as timestamp FROM entries WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
    }

    // Ensure all entries have a timestamp field for consistency
    return (result as LocalJournalEntry[]).map(entry => ({
      ...entry,
      timestamp: entry.timestamp || entry.created_at
    }));
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
    // Check if sync is already in progress
    const { syncInProgress } = useJournalStore.getState();
    if (syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

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
        entry.timestamp // preserve original user timestamp
      );
    }

    if (unsynced.length > 0) {
      console.log(`✅ Synced ${unsynced.length} entries.`);
    }
  } catch (err) {
    console.warn('Error syncing unsynced entries:', err);
  }
}