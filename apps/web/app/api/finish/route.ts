import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddings, type ChatMessage } from '../lib/ai-client';
import { getDbClient } from '../lib/database';

export async function POST(request: NextRequest) {
  try {
    const { chat, userId = 'anonymous' }: { chat: ChatMessage[], userId?: string } = await request.json();

    if (!chat || !Array.isArray(chat)) {
      return NextResponse.json({ error: 'Invalid chat data' }, { status: 400 });
    }

    console.log('Processing chat for embeddings and database storage...');
    
    const chatText = chat
      .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");
    
    const embedding = await getEmbeddings(chatText);
    
    const dbClient = getDbClient();
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
    
    return NextResponse.json({ 
      success: true, 
      entryId,
      message: 'Chat successfully saved and processed for embeddings'
    });
  } catch (error) {
    console.error('Error in finish API:', error);
    return NextResponse.json(
      { error: 'Failed to process finish request' }, 
      { status: 500 }
    );
  }
}