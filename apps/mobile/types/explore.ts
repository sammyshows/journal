export interface ExploreMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface JournalEntryCard {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  date: string;
}

export interface ExploreResponse {
  type: 'fallback' | 'insight';
  reply: string;
  entries?: JournalEntryCard[];
} 