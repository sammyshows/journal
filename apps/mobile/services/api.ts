// Use EXPO_PUBLIC_ environment variables (no need for @env import)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9999';

export interface JournalEntry {
  journal_entry_id?: string;
  content: string;
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


// API Client
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
    console.log('API_URL', this.baseUrl);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

export const apiService = {
  // Journal endpoints
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: JournalEntry[];
      }>('/journal-entries', { userId });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }
  },

  async getJournalEntry(id: string): Promise<JournalEntry | null> {
    try {
      const response = await apiClient.get<JournalEntry>(`/journal-entries/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      return null;
    }
  },

  async createJournalEntry(journal_entry_id: string, content: string, userId?: string, created_at?: string): Promise<{ success: boolean; entryId: string; message: string }> {
    try {
      const chat: JournalMessage[] = [{ role: 'user', content }];
      const response = await apiClient.post<{
        success: boolean;
        entryId: string;
        message: string;
      }>('/finish', {
        journal_entry_id,
        userId,
        chat,
        created_at
      });
      
      return response;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },

  // Stats endpoint - computed from real data
  async getUserStats(userId?: string): Promise<UserStats> {
    try {
      // Get all entries for the user to compute stats
      const entries = await this.getJournalEntries(userId);
      
      // Calculate streak
      const sortedEntries = entries.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = new Date(sortedEntries[i].created_at);
        const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === i) {
          streak++;
        } else {
          break;
        }
      }
      
      // Calculate weekly entries
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const currentWeekEntries = entries.filter(entry => 
        new Date(entry.created_at) >= oneWeekAgo
      ).length;
      
      return {
        totalEntries: entries.length,
        streak,
        weeklyGoal: 5, // Could be user configurable
        currentWeekEntries
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return default stats on error
      return {
        totalEntries: 0,
        streak: 0,
        weeklyGoal: 5,
        currentWeekEntries: 0
      };
    }
  },

  // Explore endpoint
  async sendMessageToExplore(chat: ExploreMessage[], userId?: string): Promise<ExploreResponse> {
    try {
      const response = await apiClient.post<ExploreResponse>('/explore', { chat, userId });
      return response;
    } catch (error) {
      console.error('Error sending message to assistant:', error);
      throw new Error('Failed to get AI response');
    }
  },

  // Search endpoint
  // async searchEntries(query: string, userId?: string): Promise<SearchResponse> {
  //   try {
  //     const response = await apiClient.post<SearchResponse>('/search', { query, userId });
  //     return response;
  //   } catch (error) {
  //     console.error('Error searching entries:', error);
  //     throw new Error('Search failed');
  //   }
  // },

  // Additional endpoints for mobile-specific features
  // async getSoulMapData(userId?: string) {
  //   try {
  //     const params = new URLSearchParams({
  //       ...(userId && { userId })
  //     });
      
  //     const response = await apiClient.get(`/soul-map?${params}`);
  //     return response;
  //   } catch (error) {
  //     console.error('Error fetching soul map data:', error);
  //     throw error;
  //   }
  // },

  // async getTopNodes(limit: number = 5, userId?: string, relatedTo?: string) {
  //   try {
  //     const params = new URLSearchParams({
  //       limit: limit.toString(),
  //       ...(userId && { userId }),
  //       ...(relatedTo && { relatedTo })
  //     });
      
  //     const response = await apiClient.get(`/top-nodes?${params}`);
  //     return response;
  //   } catch (error) {
  //     console.error('Error fetching top nodes:', error);
  //     throw error;
  //   }
  // }
};