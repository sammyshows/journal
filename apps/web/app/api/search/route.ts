import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { createAIClient } from '../lib/ai-client'

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'journal',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
})

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const ai = createAIClient()
    const client = await pool.connect()

    try {
      // Generate embedding for the search query
      const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
          input: [query],
          model: 'voyage-3-large'
        })
      })

      if (!embeddingResponse.ok) {
        throw new Error('Failed to generate embedding')
      }

      const embeddingData = await embeddingResponse.json()
      const queryEmbedding = embeddingData.data[0].embedding

      // Search for similar journal entries using vector similarity
      const userId = '123e4567-e89b-12d3-a456-426614174000'; // TODO: Get from auth
      const searchQuery = `
        SELECT 
          journal_entry_id,
          content,
          created_at,
          metadata,
          1 - (embedding <=> $1::vector) as similarity_score
        FROM journal_entries 
        WHERE embedding IS NOT NULL AND user_id = $2
        ORDER BY embedding <=> $1::vector
        LIMIT 3
      `

      const searchResult = await client.query(searchQuery, [JSON.stringify(queryEmbedding), userId])
      const relatedEntries = searchResult.rows.filter((row: any) => row.similarity_score > 0.4)

      // Generate AI response based on the query and related entries
      const context = relatedEntries.length > 0 
        ? `Based on the user's past journal entries:\n\n${relatedEntries.map((entry: any) => 
            `Entry from ${new Date(entry.created_at).toLocaleDateString()}: ${entry.content}`
          ).join('\n\n')}`
        : 'No closely related entries found in the user\'s journal history.'

      const aiPrompt = `You are a thoughtful AI assistant helping someone reflect on their past journal entries. The user is asking about their personal experiences, and you have access to some of their previous journal entries that may be relevant.

User's question: "${query}"

${context}

Instructions:
- Provide a concise, direct response (1-2 paragraphs maximum) that specifically answers their question
- Reference specific details from their journal entries when relevant
- Be empathetic but focused - don't expand beyond what they asked
- If the journal entries don't contain relevant information, briefly acknowledge this
- Keep your response conversational and supportive
- Answer only what they asked - don't suggest additional topics or directions

Response:`

      const aiResponse = await ai.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: aiPrompt
          }
        ]
      })

      const aiContent = aiResponse.content[0]?.type === 'text' 
        ? aiResponse.content[0].text 
        : 'I apologize, but I could not generate a response at this time.'

      return NextResponse.json({
        query,
        response: aiContent,
        related_entries: relatedEntries
      })

    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}