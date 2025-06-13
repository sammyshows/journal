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
      const countResult = await client.query('SELECT COUNT(*) FROM edges');
      const total = parseInt(countResult.rows[0].count);

      // Get edges with node labels for better readability
      const result = await client.query(
        `SELECT 
          e.edge_id,
          e.from_node_id,
          e.to_node_id,
          e.weight, 
          e.timestamps, 
          e.source_entry_id, 
          e.user_id, 
          e.created_at,
          n1.label as from_label,
          n1.type as from_type,
          n2.label as to_label,
          n2.type as to_type
         FROM edges e
         JOIN nodes n1 ON e.from_node_id = n1.node_id
         JOIN nodes n2 ON e.to_node_id = n2.node_id
         ORDER BY e.created_at DESC 
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
    console.error('Error fetching edges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edges' },
      { status: 500 }
    );
  }
}