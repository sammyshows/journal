import Anthropic from "@anthropic-ai/sdk";
import { dbClient } from "./database";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

/**
 * Sends a prompt to Anthropic Haiku 3 and returns the response.
 * @param prompt The user or system prompt to send.
 * @returns The AI's reply as a string.
 */
export async function sendToAnthropicAPI(apiKey: string, prompt: string): Promise<string> {
  const anthropic = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true // For local development testing only
  });

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // The response.content is an array of content blocks
  if (Array.isArray(response.content)) {
    return response.content
      .map(part => {
        if (typeof part === "string") return part;
        if (part.type === "text") return part.text;
        return "";
      })
      .join("");
  }
  // fallback for string content
  return typeof response.content === "string" ? response.content : "";
}

/**
 * Saves a chat conversation to the database with embeddings.
 * @param apiKey The Voyage AI API key
 * @param chat Array of chat messages to embed and save
 * @param userId Optional user ID (defaults to 'anonymous' for now)
 * @returns Promise that resolves when the journal entry is saved
 */
export async function sendToEmbeddingsAPI(apiKey: string, chat: ChatMessage[], userId: string = 'anonymous'): Promise<void> {
  console.log('Processing chat for embeddings and database storage...');
  
  // Convert chat to a single text string for embedding
  const chatText = chat
    .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");
  
  try {
    // Get embeddings from Voyage AI
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: [chatText],
        model: 'voyage-3-large'
      })
    });

    if (!response.ok) {
      throw new Error(`Voyage AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0]?.embedding;
    
    if (!embedding) {
      throw new Error('No embedding returned from Voyage AI');
    }

    // Save to database
    const entryId = await dbClient.saveJournalEntry({
      user_id: userId,
      content: chatText,
      embedding: embedding,
      metadata: {
        message_count: chat.length,
        created_via: 'web_app',
        model_used: 'voyage-3-large'
      }
    });
    
    console.log(`Journal entry saved with ID: ${entryId}`);
    
  } catch (error) {
    console.error('Error processing chat for embeddings:', error);
    throw error;
  }
}
