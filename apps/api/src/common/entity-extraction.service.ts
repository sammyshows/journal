import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { Entity, Relationship, ExtractionResult, GraphNode, GraphEdge, GraphExtractionResult } from './interfaces';

@Injectable()
export class EntityExtractionService {
  constructor(private readonly aiService: AiService) {}

  async extractEntitiesAndRelationships(journalText: string): Promise<ExtractionResult> {
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

Entities: ${JSON.stringify((await this.getEntitiesFirst(journalText)).entities)}

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
      const entitiesResponse = await this.aiService.sendToAnthropicAPI(entityPrompt);
      const entitiesData = JSON.parse(entitiesResponse);

      // Then extract relationships
      const relationshipsResponse = await this.aiService.sendToAnthropicAPI(relationshipPrompt);
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

  private async getEntitiesFirst(journalText: string): Promise<{ entities: Entity[] }> {
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

    const response = await this.aiService.sendToAnthropicAPI(entityPrompt);
    return JSON.parse(response);
  }

  async extractNodesAndEdges(journalText: string): Promise<GraphExtractionResult> {
    const prompt = `
      You are a graph-mapping assistant that analyzes journal entries to extract **emotional, psychological, and narrative structure**.
      
      Your job is to identify:
      - Key **nodes**: important people, emotions, themes, events.
      - Key **edges**: meaningful relationships between those nodes, including direction and emotional intensity.
      
      📌 Output:
      Return **ONLY** a valid **raw JSON object** with this exact format. Do **NOT** include any preamble, commentary, or markdown.
      
      {
        "nodes": [
          { "label": "string", "type": "emotion|theme|person|event" },
          ...
        ],
        "edges": [
          { "from": "string", "to": "string", "weight": float between -1.0 and 1.0 },
          ...
        ]
      }
      
      Weight represents the **strength and polarity** of the relationship:
      - Positive = supportive or motivating
      - Negative = draining or harmful
      
      ⚠️ IMPORTANT:
      - Do not add explanations or extra text.
      - Return only the raw JSON object (no backticks, no markdown, no prose).
      - Include at least 1 node and 1 edge if possible.
      
      ---
      
      📝 Journal Entry:
      ${journalText}
    `.trim()
     .replace(/^```json/, '')
     .replace(/^```/, '')
     .replace(/```$/, '')
     .trim();

    try {
      const response = await this.aiService.sendToAnthropicAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Graph extraction failed:', error);
      return { nodes: [], edges: [] };
    }
  }
}