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
      const searchQuery = `
        SELECT 
          id,
          content,
          created_at,
          metadata,
          1 - (embedding <=> $1::vector) as similarity_score
        FROM journal_entries 
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT 5
      `

      const searchResult = await client.query(searchQuery, [JSON.stringify(queryEmbedding)])
      const relatedEntries = searchResult.rows.filter((row: any) => row.similarity_score > 0.3)

      // Generate AI response based on the query and related entries
      const context = relatedEntries.length > 0 
        ? `Based on the user's past journal entries:\n\n${relatedEntries.map((entry: any) => 
            `Entry from ${new Date(entry.created_at).toLocaleDateString()}: ${entry.content}`
          ).join('\n\n')}`
        : 'No closely related entries found in the user\'s journal history.'

      const aiPrompt = `
        The user is asking: "${query}"
        
        ${context}
        
        Provide a thoughtful, empathetic response that:
        1. Addresses their current question/situation
        2. Draws connections to their past experiences if relevant entries were found
        3. Offers insights or perspectives that might be helpful
        4. Maintains a supportive, reflective tone
        
        Keep the response conversational and personal, as if you're a trusted friend who knows their history.
      `

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