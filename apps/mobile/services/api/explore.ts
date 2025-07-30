import apiClient from './client';
import type { ExploreMessage, JournalEntryCard, ExploreResponse } from '../../types';

export async function sendMessageToExplore(chat: ExploreMessage[], userId?: string): Promise<ExploreResponse> {
  try {
    const response = await apiClient.post<ExploreResponse>('/explore', { chat, userId });
    return response;
  } catch (error) {
    console.error('Error sending message to assistant:', error);
    throw new Error('Failed to get AI response');
  }
}