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
    const userId = searchParams.get('userId')

    const client = await pool.connect()
    
    try {
      let query = `
        SELECT 
          content,
          created_at
        FROM journal_entries
      `
      const params: any[] = []

      if (userId) {
        query += ` WHERE user_id = $1`
        params.push(userId)
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limit, offset)

      const result = await client.query(query, params)

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM journal_entries'
      const countParams: any[] = []
      
      if (userId) {
        countQuery += ' WHERE user_id = $1'
        countParams.push(userId)
      }

      const countResult = await client.query(countQuery, countParams)
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
    console.error('Journal entries query error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    )
  }
}