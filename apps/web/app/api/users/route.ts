import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'journal',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const client = await pool.connect()
    
    try {
      const query = `
        SELECT 
          id,
          name,
          created_at,
          updated_at,
          reflection_preferences,
          emotional_patterns
        FROM user_profiles
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `

      const result = await client.query(query, [limit, offset])

      // Get total count for pagination
      const countResult = await client.query('SELECT COUNT(*) FROM user_profiles')
      const totalCount = parseInt(countResult.rows[0].count)

      return NextResponse.json({
        success: true,
        data: result.rows,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Users query error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, name, reflection_preferences, emotional_patterns } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      const query = `
        INSERT INTO user_profiles (user_id, name, reflection_preferences, emotional_patterns)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          reflection_preferences = EXCLUDED.reflection_preferences,
          emotional_patterns = EXCLUDED.emotional_patterns,
          updated_at = NOW()
        RETURNING *
      `

      const result = await client.query(query, [
        user_id,
        name || null,
        JSON.stringify(reflection_preferences || {}),
        JSON.stringify(emotional_patterns || {})
      ])

      return NextResponse.json({
        success: true,
        data: result.rows[0]
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Create/update user error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}