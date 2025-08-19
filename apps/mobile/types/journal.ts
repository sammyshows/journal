export interface JournalEntry {
  journal_entry_id?: string;
  content: string;
  timestamp: string;
  created_at: string;
  metadata?: {
    message_count?: number;
    created_via?: string;
    model_used?: string;
  };
  emoji?: string;
  tags?: string[];
  title?: string;
  user_summary?: string;
  ai_summary?: string;
}

export interface JournalMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface SearchResult {
  journal_entry_id: string;
  content: string;
  created_at: string;
  metadata: any;
  similarity_score: number;
}

export interface SearchResponse {
  query: string;
  response: string;
  related_entries: SearchResult[];
}

export interface UserStats {
  totalEntries: number;
  streak: number;
  weeklyGoal: number;
  currentWeekEntries: number;
} 