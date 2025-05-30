import { NextRequest, NextResponse } from 'next/server';
import { sendToAnthropicAPI, type ChatMessage } from '../lib/ai-client';
import { getJournalAIRolePrompt } from '../lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { chat }: { chat: ChatMessage[] } = await request.json();

    if (!chat || !Array.isArray(chat)) {
      return NextResponse.json({ error: 'Invalid chat data' }, { status: 400 });
    }

    const rolePrompt = getJournalAIRolePrompt();
    const chatMessages = chat
      .map((msg) =>
        msg.role === "user"
          ? `User: ${msg.content}`
          : `Assistant: ${msg.content}`
      )
      .join("\n");
    
    const prompt = `${rolePrompt}\n\n${chatMessages}\nAssistant:`;

    const reply = await sendToAnthropicAPI(prompt);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' }, 
      { status: 500 }
    );
  }
}