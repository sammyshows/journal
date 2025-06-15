export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export interface JournalEntry {
  journal_entry_id?: string;
  user_id: string;
  content: string;
  embedding?: number[];
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;
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