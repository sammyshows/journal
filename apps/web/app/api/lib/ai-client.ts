import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export function createAIClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  return new Anthropic({
    apiKey,
  });
}

export async function sendToAnthropicAPI(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const anthropic = new Anthropic({
    apiKey,
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

  if (Array.isArray(response.content)) {
    return response.content
      .map(part => {
        if (typeof part === "string") return part;
        if (part.type === "text") return part.text;
        return "";
      })
      .join("");
  }
  
  return typeof response.content === "string" ? response.content : "";
}

export async function getEmbeddings(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: [text],
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

  return embedding;
}