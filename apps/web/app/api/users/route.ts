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
    const client = await pool.connect()
    
    try {
      const query = `
        SELECT 
          name,
          user_id
        FROM users
        ORDER BY created_at DESC
      `

      const result = await client.query(query)

      return NextResponse.json({
        success: true,
        data: result.rows
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
    const { user_id, name } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      const query = `
        INSERT INTO users (user_id, name)
        VALUES ($1, $2)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          updated_at = NOW()
        RETURNING *
      `

      const result = await client.query(query, [
        user_id,
        name || null
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