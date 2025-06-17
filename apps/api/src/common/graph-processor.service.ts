import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GraphNode, GraphEdge, GraphExtractionResult } from './interfaces';

@Injectable()
export class GraphProcessorService {
  constructor(private readonly databaseService: DatabaseService) {}

  async processJournalEntryForGraph(
    userId: string, 
    entryId: string, 
    extraction: GraphExtractionResult
  ): Promise<void> {
    const client = await this.databaseService.getClient();
    
    try {
      await client.query('BEGIN');

      // Process nodes
      const nodeIds: Record<string, string> = {};
      for (const node of extraction.nodes) {
        const nodeId = await this.upsertNode(client, userId, node);
        nodeIds[node.label] = nodeId;
        
        // Map node to entry
        await this.mapNodeToEntry(client, nodeId, entryId, userId);
      }

      // Process edges
      for (const edge of extraction.edges) {
        const fromNodeId = nodeIds[edge.from];
        const toNodeId = nodeIds[edge.to];
        
        if (fromNodeId && toNodeId) {
          await this.upsertEdge(client, fromNodeId, toNodeId, edge.weight, entryId, userId);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Graph processing failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async upsertNode(client: any, userId: string, node: GraphNode): Promise<string> {
    // Check if node exists
    const existingNode = await client.query(
      'SELECT node_id FROM nodes WHERE label = $1 AND type = $2 AND user_id = $3',
      [node.label, node.type, userId]
    );

    if (existingNode.rows.length > 0) {
      return existingNode.rows[0].node_id;
    }

    // Create new node
    const result = await client.query(
      'INSERT INTO nodes (label, type, user_id) VALUES ($1, $2, $3) RETURNING node_id',
      [node.label, node.type, userId]
    );

    return result.rows[0].node_id;
  }

  private async upsertEdge(
    client: any, 
    fromNodeId: string, 
    toNodeId: string, 
    weight: number, 
    entryId: string, 
    userId: string
  ): Promise<void> {
    // Check if edge exists
    const existingEdge = await client.query(
      'SELECT edge_id, timestamps FROM edges WHERE from_node_id = $1 AND to_node_id = $2 AND user_id = $3',
      [fromNodeId, toNodeId, userId]
    );

    if (existingEdge.rows.length > 0) {
      // Update existing edge
      const currentTimestamps = existingEdge.rows[0].timestamps || [];
      const newTimestamps = [...currentTimestamps, new Date()];
      
      await client.query(
        'UPDATE edges SET weight = $1, timestamps = $2, source_entry_id = $3 WHERE edge_id = $4',
        [weight, newTimestamps, entryId, existingEdge.rows[0].edge_id]
      );
    } else {
      // Create new edge
      await client.query(
        'INSERT INTO edges (from_node_id, to_node_id, weight, timestamps, source_entry_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [fromNodeId, toNodeId, weight, [new Date()], entryId, userId]
      );
    }
  }

  private async mapNodeToEntry(client: any, nodeId: string, entryId: string, userId: string): Promise<void> {
    // Insert node-entry mapping if it doesn't exist
    await client.query(
      'INSERT INTO node_entry_map (node_id, entry_id, user_id) VALUES ($1, $2, $3) ON CONFLICT (node_id, entry_id) DO NOTHING',
      [nodeId, entryId, userId]
    );
  }

  async getUserGraph(userId: string): Promise<{ nodes: any[], edges: any[] }> {
    const client = await this.databaseService.getClient();
    
    try {
      // Get nodes
      const nodesResult = await client.query(
        'SELECT node_id, label, type, created_at FROM nodes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      
      // Get edges with node labels
      const edgesResult = await client.query(
        `SELECT 
          e.edge_id, e.weight, e.timestamps, e.created_at,
          n1.label as from_label, n1.type as from_type,
          n2.label as to_label, n2.type as to_type
        FROM edges e
        JOIN nodes n1 ON e.from_node_id = n1.node_id
        JOIN nodes n2 ON e.to_node_id = n2.node_id
        WHERE e.user_id = $1
        ORDER BY e.weight DESC
        LIMIT 100`,
        [userId]
      );

      return {
        nodes: nodesResult.rows.map(row => ({
          node_id: row.node_id,
          label: row.label,
          type: row.type,
          created_at: row.created_at
        })),
        edges: edgesResult.rows.map(row => ({
          edge_id: row.edge_id,
          from: row.from_label,
          to: row.to_label,
          weight: row.weight,
          timestamps: row.timestamps,
          created_at: row.created_at
        }))
      };
    } finally {
      client.release();
    }
  }
}