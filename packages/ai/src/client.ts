import Anthropic from "@anthropic-ai/sdk";

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
 * Sends a chat conversation to Voyage AI embeddings API and returns the embeddings.
 * @param apiKey The Voyage AI API key
 * @param chat Array of chat messages to embed
 * @returns Promise that resolves when embeddings are processed
 */
export async function sendToEmbeddingsAPI(apiKey: string, chat: ChatMessage[]): Promise<void> {
  console.log('Sending chat to Voyage AI embeddings API...');
  console.log('Chat messages:', chat);
  
  // Convert chat to a single text string for embedding
  const chatText = chat
    .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");
  
  console.log('Combined chat text:', chatText);
  
  try {
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
    console.log('Received embeddings from Voyage AI:', data);
    
    // TODO: Insert into vector database
    console.log('TODO: Insert embeddings into vector database (Supabase + pgvector)');
    console.log('TODO: Extract emotions and topics for graph database (Neo4j)');
    
  } catch (error) {
    console.error('Error sending chat to Voyage AI embeddings:', error);
    throw error;
  }
}
