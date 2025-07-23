import { ApiProperty } from '@nestjs/swagger';

export class GraphNode {
  @ApiProperty()
  label: string;

  @ApiProperty()
  type: string;
}

export class GraphEdge {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  weight: number;
}

export class GraphExtractionResult {
  @ApiProperty({ type: [GraphNode] })
  nodes: GraphNode[];

  @ApiProperty({ type: [GraphEdge] })
  edges: GraphEdge[];
}

export class Node {
  @ApiProperty()
  node_id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  created_at: Date;
}

export class Edge {
  @ApiProperty()
  edge_id: string;

  @ApiProperty()
  from_node_id: string;

  @ApiProperty()
  to_node_id: string;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  timestamps: Date[];

  @ApiProperty()
  source_entry_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  from_label: string;

  @ApiProperty()
  from_type: string;

  @ApiProperty()
  to_label: string;

  @ApiProperty()
  to_type: string;
}

export class PaginationInfo {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  hasMore: boolean;
}

export class NodesResponseDto {
  @ApiProperty({ type: [Node] })
  data: Node[];

  @ApiProperty({ type: PaginationInfo })
  pagination: PaginationInfo;
}

export class EdgesResponseDto {
  @ApiProperty({ type: [Edge] })
  data: Edge[];

  @ApiProperty({ type: PaginationInfo })
  pagination: PaginationInfo;
}

export class SoulMapNode {
  @ApiProperty()
  node_id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  strength: number;

  @ApiProperty()
  sentiment: number;

  @ApiProperty()
  intensity: number;

  @ApiProperty()
  mentionCount: number;

  @ApiProperty()
  properties: Record<string, any>;
}

export class SoulMapEdge {
  @ApiProperty()
  edge_id: string;

  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  sentiment: number;

  @ApiProperty()
  context: string;

  @ApiProperty()
  coOccurrenceCount: number;
}

export class SoulMapStats {
  @ApiProperty()
  nodeCount: number;

  @ApiProperty()
  edgeCount: number;

  @ApiProperty()
  strongestNode: string;
}

export class SoulMapResponseDto {
  @ApiProperty({ type: [SoulMapNode] })
  nodes: SoulMapNode[];

  @ApiProperty({ type: [SoulMapEdge] })
  edges: SoulMapEdge[];

  @ApiProperty({ type: SoulMapStats })
  stats: SoulMapStats;
}

export class TopNode {
  @ApiProperty()
  node_id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  edge_count: number;

  @ApiProperty()
  total_weight: number;

  @ApiProperty()
  entry_count: number;

  @ApiProperty()
  score: number;

  @ApiProperty()
  connection_weight: number;

  @ApiProperty()
  connection_type: string;

  @ApiProperty()
  created_at: Date;
}

export class TopNodesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [TopNode] })
  data: TopNode[];
}

export interface Entity {
  name: string;
  display_name: string;
  type: 'Person' | 'Place' | 'Emotion' | 'Topic' | 'Goal' | 'Activity';
  strength_score: number; // 0-10
  avg_sentiment: number; // -1 to 1
  emotional_intensity: number; // 0-1
  properties: Record<string, any>;
  confidence_score: number; // 0-1
}

export interface Relationship {
  from_entity: string;
  to_entity: string;
  relationship_type: 'MENTIONED_WITH' | 'CAUSES' | 'TRIGGERS' | 'HELPS_WITH' | 'CONFLICTS_WITH' | 'TEMPORALLY_LINKED';
  weight: number; // 0-10
  avg_sentiment: number; // -1 to 1
  relationship_context: string;
  confidence_score: number; // 0-1
  evidence_quote: string;
}

export interface ExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
}

export interface GraphNode {
  label: string;
  type: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface GraphExtractionResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}