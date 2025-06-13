import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/journal'
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = await pool.connect();
    
    try {
      // Get total count
      const countResult = await client.query('SELECT COUNT(*) FROM nodes');
      const total = parseInt(countResult.rows[0].count);

      // Get nodes with pagination
      const result = await client.query(
        `SELECT node_id, label, type, user_id, created_at 
         FROM nodes 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return NextResponse.json({
        data: result.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nodes' },
      { status: 500 }
    );
  }
}