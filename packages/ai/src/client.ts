import Anthropic from "@anthropic-ai/sdk";

/**
 * Sends a prompt to Anthropic Haiku 3 and returns the response.
 * @param prompt The user or system prompt to send.
 * @returns The AI's reply as a string.
 */
export async function sendToAnthropic(apiKey: string, prompt: string): Promise<string> {
  console.log('apiKey', apiKey);
  const anthropic = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
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

  // The response.completion or response.content depending on SDK version
  // Here, we assume response.content is an array of message parts
  if (Array.isArray(response.content)) {
    return response.content.map(part => (typeof part === "string" ? part : part.text)).join("");
  }
  // fallback for string content
  return typeof response.content === "string" ? response.content : "";
}
