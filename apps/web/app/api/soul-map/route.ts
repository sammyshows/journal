import { NextRequest, NextResponse } from 'next/server';
import { getGraphProcessor } from '../lib/graph-processor';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '123e4567-e89b-12d3-a456-426614174000'; // TODO: Get from auth

    console.log(`Fetching graph data for user ${userId}`);

    const graphProcessor = getGraphProcessor();
    const graphData = await graphProcessor.getUserGraph(userId);

    // Transform the data for the frontend
    const transformedNodes = graphData.nodes.map((node, index) => ({
      node_id: node.node_id,
      label: node.display_name || node.name || `Node ${index}`,
      type: node.label || 'Unknown',
      strength: node.strength_score || 1,
      sentiment: node.avg_sentiment || 0,
      intensity: node.emotional_intensity || 0,
      mentionCount: node.mention_count || 1,
      properties: node.properties || {}
    }));

    const transformedEdges = graphData.edges.map((edge, index) => ({
      edge_id: edge.edge_id,
      from: edge.from,
      to: edge.to,
      type: edge.type,
      weight: edge.properties?.weight || 1,
      sentiment: edge.properties?.avg_sentiment || 0,
      context: edge.properties?.relationship_context || '',
      coOccurrenceCount: edge.properties?.co_occurrence_count || 1
    }));

    return NextResponse.json({
      nodes: transformedNodes,
      edges: transformedEdges,
      stats: {
        nodeCount: transformedNodes.length,
        edgeCount: transformedEdges.length,
        strongestNode: transformedNodes.sort((a, b) => b.strength - a.strength)[0]?.label || 'None'
      }
    });

  } catch (error) {
    console.error('Soul map fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch soul map data' },
      { status: 500 }
    );
  }
}