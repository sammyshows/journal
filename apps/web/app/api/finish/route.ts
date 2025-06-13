import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddings, type ChatMessage } from '../lib/ai-client';
import { getDbClient } from '../lib/database';
import { extractNodesAndEdges } from '../lib/entity-extraction';
import { getGraphProcessor } from '../lib/graph-processor';

export async function POST(request: NextRequest) {
  try {
    const { chat, userId }: { chat: ChatMessage[], userId?: string } = await request.json();

    if (!chat || !Array.isArray(chat)) {
      return NextResponse.json({ error: 'Invalid chat data' }, { status: 400 });
    }

    console.log('Processing chat for embeddings and database storage...');
    
    let chatText
    if (chat.length === 1) {
      chatText = chat[0]?.content || 'Oops, no content.'
    } else {
      chatText = chat
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
    }
    
    const embedding = await getEmbeddings(chatText);
    
    const dbClient = getDbClient();
    const entryId = await dbClient.saveJournalEntry({
      user_id: userId || 'default-user',
      content: chatText,
      embedding: embedding,
      metadata: {
        message_count: chat.length,
        created_via: 'web_app',
        model_used: 'voyage-3-large'
      }
    });
    
    console.log(`Journal entry saved with ID: ${entryId}`);
    
    // Process graph data synchronously (with error handling)
    try {
      console.log('Processing graph data synchronously...');
      const extraction = await extractNodesAndEdges(chatText);
      console.log(`Extracted ${extraction.nodes.length} nodes and ${extraction.edges.length} edges`);
      
      const graphProcessor = getGraphProcessor();
      await graphProcessor.processJournalEntryForGraph(userId || 'default-user', entryId, extraction);
      console.log('Graph processing completed successfully');
    } catch (error) {
      console.warn('Graph processing failed (continuing without graph data):', error);
      // Don't fail the main request if graph processing fails
    }
    
    return NextResponse.json({ 
      success: true, 
      entryId,
      message: 'Journal entry successfully saved and processed for graph data'
    });
  } catch (error) {
    console.error('Error in finish API:', error);
    return NextResponse.json(
      { error: 'Failed to process finish request' }, 
      { status: 500 }
    );
  }
}