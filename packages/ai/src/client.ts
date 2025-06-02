export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

/**
 * Sends a chat to the internal API and returns the AI response.
 * @param chat Array of chat messages
 * @returns The AI's reply as a string
 */
export async function sendChatMessage(chat: ChatMessage[]): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat }),
  });

  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }

  const data = await response.json();
  return data.reply || "Sorry, I couldn't respond.";
}

/**
 * Finishes a chat conversation by saving it with embeddings.
 * @param chat Array of chat messages to save
 * @param userId Optional user ID (defaults to 'anonymous')
 * @returns Promise that resolves when the journal entry is saved
 */
export async function finishChatConversation(chat: ChatMessage[], userId: string = 'anonymous'): Promise<void> {
  const response = await fetch('/api/finish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to finish chat');
  }

  const data = await response.json();
  console.log(data.message);
}
