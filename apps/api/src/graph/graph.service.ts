import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EntityExtractionService } from '../common/entity-extraction.service';
import { GraphProcessorService } from '../common/graph-processor.service';
import { 
  GraphNode, 
  GraphEdge, 
  GraphExtractionResult,
  NodesResponseDto,
  EdgesResponseDto,
  SoulMapResponseDto,
  TopNodesResponseDto
} from './graph.dto';

@Injectable()
export class GraphService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly entityExtractionService: EntityExtractionService,
    private readonly graphProcessorService: GraphProcessorService,
  ) {}

  async extractNodesAndEdges(journalText: string): Promise<GraphExtractionResult> {
    return this.entityExtractionService.extractNodesAndEdges(journalText);
  }

  async processJournalEntryForGraph(
    userId: string, 
    entryId: string, 
    extraction: GraphExtractionResult
  ): Promise<void> {
    return this.graphProcessorService.processJournalEntryForGraph(userId, entryId, extraction);
  }

  async getNodes(limit: number, offset: number): Promise<NodesResponseDto> {
    const client = await this.databaseService.getClient();
    
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

      return {
        data: result.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } finally {
      client.release();
    }
  }

  async getEdges(limit: number, offset: number): Promise<EdgesResponseDto> {
    const client = await this.databaseService.getClient();
    
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

      return {
        data: result.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } finally {
      client.release();
    }
  }

  async getSoulMap(userId: string): Promise<SoulMapResponseDto> {
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

      // Transform the data for the frontend
      const transformedNodes = nodesResult.rows.map((node, index) => ({
        node_id: node.node_id,
        label: node.label || `Node ${index}`,
        type: node.type || 'Unknown',
        strength: 1,
        sentiment: 0,
        intensity: 0,
        mentionCount: 1,
        properties: {}
      }));

      const transformedEdges = edgesResult.rows.map((edge, index) => ({
        edge_id: edge.edge_id,
        from: edge.from_label,
        to: edge.to_label,
        type: 'relationship',
        weight: edge.weight || 1,
        sentiment: 0,
        context: '',
        coOccurrenceCount: 1
      }));

      return {
        nodes: transformedNodes,
        edges: transformedEdges,
        stats: {
          nodeCount: transformedNodes.length,
          edgeCount: transformedEdges.length,
          strongestNode: transformedNodes.sort((a, b) => b.strength - a.strength)[0]?.label || 'None'
        }
      };
    } finally {
      client.release();
    }
  }

  async getTopNodes(limit: number, userId?: string, relatedToNodeId?: string): Promise<TopNodesResponseDto> {
    const client = await this.databaseService.getClient();
    
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

      return {
        success: true,
        data: nodes
      };
    } finally {
      client.release();
    }
  }
}