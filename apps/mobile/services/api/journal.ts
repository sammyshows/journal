import apiClient from './client';
import type { 
  JournalEntry, 
  JournalMessage, 
  SearchResult, 
  SearchResponse, 
  UserStats 
} from '../../types';

// Journal endpoints
export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      data: JournalEntry[];
    }>('/get-journal-entries', { userId });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }
}

export async function getJournalEntry(journalEntryId: string): Promise<JournalEntry | null> {
  try {
    return await apiClient.post<JournalEntry>(`/get-journal-entry`, { journalEntryId });
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return null;
  }
}

export async function createJournalEntry(journalEntryId: string, content: string, userId: string, createdAt?: string): Promise<{ success: boolean; entryId: string; message: string }> {
  try {
    const chat: JournalMessage[] = [{ role: 'user', content }];
    const response = await apiClient.post<{
      success: boolean;
      entryId: string;
      message: string;
    }>('/create-journal-entry', {
      journalEntryId,
      userId,
      chat,
      createdAt
    });
    
    return response;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
}

export async function updateJournalEntry(journalEntryId: string, title: string, emoji: string): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
    }>('/update-journal-entry', {
      journalEntryId,
      title,
      emoji
    });
    
    return response;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}

export async function deleteJournalEntry(journalEntryId: string): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
    }>('/delete-journal-entry', {
      journalEntryId
    });
    
    return response;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

export async function updateJournalEntryDateTime(journalEntryId: string, createdAt: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>('/update-journal-entry-datetime', {
      journal_entry_id: journalEntryId,
      created_at: createdAt
    });
    
    return response;
  } catch (error) {
    console.error('Error updating journal entry date/time:', error);
    throw error;
  }
}