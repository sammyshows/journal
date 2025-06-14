import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/journal'
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const userId = searchParams.get('userId');
    const relatedToNodeId = searchParams.get('relatedTo');

    const client = await pool.connect();
    
    try {
      let result;
      
      if (relatedToNodeId) {
        // Get nodes related to a specific node
        result = await client.query(
          `SELECT DISTINCT
            n.node_id,
            n.label,
            n.type,
            n.created_at,
            COUNT(DISTINCT e1.edge_id) + COUNT(DISTINCT e2.edge_id) as edge_count,
            COALESCE(AVG(DISTINCT e1.weight), 0) + COALESCE(AVG(DISTINCT e2.weight), 0) as total_weight,
            COUNT(DISTINCT nem.entry_id) as entry_count,
            COALESCE(e_to.weight, e_from.weight, 0) as connection_weight,
            CASE 
              WHEN e_to.edge_id IS NOT NULL THEN 'incoming'
              WHEN e_from.edge_id IS NOT NULL THEN 'outgoing'
              ELSE 'none'
            END as connection_type
           FROM nodes n
           LEFT JOIN edges e1 ON n.node_id = e1.from_node_id
           LEFT JOIN edges e2 ON n.node_id = e2.to_node_id
           LEFT JOIN node_entry_map nem ON n.node_id = nem.node_id
           LEFT JOIN edges e_to ON n.node_id = e_to.to_node_id AND e_to.from_node_id = $1
           LEFT JOIN edges e_from ON n.node_id = e_from.from_node_id AND e_from.to_node_id = $1
           WHERE n.node_id != $1 
           AND (e_to.edge_id IS NOT NULL OR e_from.edge_id IS NOT NULL)
           ${userId ? 'AND n.user_id = $3' : ''}
           GROUP BY n.node_id, n.label, n.type, n.created_at, e_to.weight, e_from.weight, e_to.edge_id, e_from.edge_id
           ORDER BY connection_weight DESC, edge_count DESC, total_weight DESC
           LIMIT $2`,
          userId ? [relatedToNodeId, limit, userId] : [relatedToNodeId, limit]
        );
      } else {
        // Get top nodes by edge count and average weight
        result = await client.query(
          `SELECT 
            n.node_id,
            n.label,
            n.type,
            n.created_at,
            COUNT(DISTINCT e1.edge_id) + COUNT(DISTINCT e2.edge_id) as edge_count,
            COALESCE(AVG(DISTINCT e1.weight), 0) + COALESCE(AVG(DISTINCT e2.weight), 0) as total_weight,
            COUNT(DISTINCT nem.entry_id) as entry_count,
            0 as connection_weight,
            'none' as connection_type
           FROM nodes n
           LEFT JOIN edges e1 ON n.node_id = e1.from_node_id
           LEFT JOIN edges e2 ON n.node_id = e2.to_node_id
           LEFT JOIN node_entry_map nem ON n.node_id = nem.node_id
           ${userId ? 'WHERE n.user_id = $1' : ''}
           GROUP BY n.node_id, n.label, n.type, n.created_at
           ORDER BY edge_count DESC, total_weight DESC, entry_count DESC
           LIMIT $${userId ? '2' : '1'}`,
          userId ? [userId, limit] : [limit]
        );
      }

      const nodes = result.rows.map(row => ({
        node_id: row.node_id,
        label: row.label,
        type: row.type,
        edge_count: parseInt(row.edge_count),
        total_weight: parseFloat(row.total_weight),
        entry_count: parseInt(row.entry_count),
        score: parseInt(row.edge_count) + parseFloat(row.total_weight) + parseInt(row.entry_count),
        connection_weight: parseFloat(row.connection_weight || 0),
        connection_type: row.connection_type,
        created_at: row.created_at
      }));

      return NextResponse.json({
        success: true,
        data: nodes
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching top nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top nodes' },
      { status: 500 }
    );
  }
}