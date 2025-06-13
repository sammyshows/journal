import { sendToAnthropicAPI } from './ai-client';

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

// New simplified interface for graph processing
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

export async function extractEntitiesAndRelationships(journalText: string): Promise<ExtractionResult> {
  const entityPrompt = `You are an expert at analyzing personal journal entries to extract meaningful entities and their emotional context. 

Analyze this journal entry and extract the most significant entities (limit to 8 maximum):

"${journalText}"

For each entity, determine:
1. name: A normalized identifier (lowercase, no spaces, e.g., "self_growth", "mom", "work_stress")
2. display_name: A human-readable version (e.g., "Self Growth", "Mom", "Work Stress")
3. type: One of [Person, Place, Emotion, Topic, Goal, Activity]
4. strength_score: Importance/prominence in this entry (0-10)
5. avg_sentiment: Emotional valence associated with this entity (-1 negative to 1 positive)
6. emotional_intensity: How emotionally charged this entity is (0-1)
7. confidence_score: How confident you are in this extraction (0-1)

Return ONLY a JSON object with this structure:
{
  "entities": [
    {
      "name": "work_stress",
      "display_name": "Work Stress", 
      "type": "Emotion",
      "strength_score": 8.5,
      "avg_sentiment": -0.7,
      "emotional_intensity": 0.9,
      "properties": {"context": "deadline pressure"},
      "confidence_score": 0.95
    }
  ]
}`;

  const relationshipPrompt = `You are an expert at identifying relationships between entities in personal journal entries.

Given this journal entry and the entities I extracted:

Journal: "${journalText}"

Entities: ${JSON.stringify((await getEntitiesFirst(journalText)).entities)}

Now identify meaningful relationships between these entities. Look for:
- Causal connections (X causes Y)
- Emotional triggers (X triggers Y emotion)  
- Support relationships (X helps with Y)
- Conflicts (X conflicts with Y)
- Co-occurrence (X mentioned with Y)
- Temporal links (X happens before/after Y)

For each relationship, provide:
1. from_entity: Source entity name
2. to_entity: Target entity name  
3. relationship_type: One of [MENTIONED_WITH, CAUSES, TRIGGERS, HELPS_WITH, CONFLICTS_WITH, TEMPORALLY_LINKED]
4. weight: Strength of connection (0-10)
5. avg_sentiment: Emotional context of relationship (-1 to 1)
6. relationship_context: Brief explanation
7. confidence_score: How confident you are (0-1)
8. evidence_quote: Short quote from text supporting this relationship

Return ONLY a JSON object:
{
  "relationships": [
    {
      "from_entity": "work_stress",
      "to_entity": "anxiety", 
      "relationship_type": "CAUSES",
      "weight": 8.0,
      "avg_sentiment": -0.8,
      "relationship_context": "work pressure triggering anxiety",
      "confidence_score": 0.9,
      "evidence_quote": "the deadline pressure is making me really anxious"
    }
  ]
}`;

  try {
    // Extract entities first
    const entitiesResponse = await sendToAnthropicAPI(entityPrompt);
    const entitiesData = JSON.parse(entitiesResponse);

    // Then extract relationships
    const relationshipsResponse = await sendToAnthropicAPI(relationshipPrompt);
    const relationshipsData = JSON.parse(relationshipsResponse);

    return {
      entities: entitiesData.entities || [],
      relationships: relationshipsData.relationships || []
    };
  } catch (error) {
    console.error('Entity extraction failed:', error);
    return { entities: [], relationships: [] };
  }
}

async function getEntitiesFirst(journalText: string): Promise<{ entities: Entity[] }> {
  const entityPrompt = `You are an expert at analyzing personal journal entries to extract meaningful entities and their emotional context. 

Analyze this journal entry and extract the most significant entities (limit to 8 maximum):

"${journalText}"

For each entity, determine:
1. name: A normalized identifier (lowercase, no spaces, e.g., "self_growth", "mom", "work_stress")
2. display_name: A human-readable version (e.g., "Self Growth", "Mom", "Work Stress")
3. type: One of [Person, Place, Emotion, Topic, Goal, Activity]
4. strength_score: Importance/prominence in this entry (0-10)
5. avg_sentiment: Emotional valence associated with this entity (-1 negative to 1 positive)
6. emotional_intensity: How emotionally charged this entity is (0-1)
7. confidence_score: How confident you are in this extraction (0-1)

Return ONLY a JSON object with this structure:
{
  "entities": [
    {
      "name": "work_stress",
      "display_name": "Work Stress", 
      "type": "Emotion",
      "strength_score": 8.5,
      "avg_sentiment": -0.7,
      "emotional_intensity": 0.9,
      "properties": {"context": "deadline pressure"},
      "confidence_score": 0.95
    }
  ]
}`;

  const response = await sendToAnthropicAPI(entityPrompt);
  return JSON.parse(response);
}

export async function extractNodesAndEdges(journalText: string): Promise<GraphExtractionResult> {
  const prompt = `You are a graph-mapping assistant. Extract important nodes and edges from this journal entry that describe emotional, psychological, or narrative structure.

Return this exact JSON format:
{
  "nodes": [
    { "label": "self-doubt", "type": "emotion" },
    { "label": "career", "type": "theme" },
    { "label": "mentor", "type": "person" }
  ],
  "edges": [
    { "from": "self-doubt", "to": "career", "weight": 0.8 },
    { "from": "mentor", "to": "self-doubt", "weight": -0.4 }
  ]
}

JOURNAL ENTRY:
${journalText}`;

  try {
    const response = await sendToAnthropicAPI(prompt);
    return JSON.parse(response);
  } catch (error) {
    console.error('Graph extraction failed:', error);
    return { nodes: [], edges: [] };
  }
}