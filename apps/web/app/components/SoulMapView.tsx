'use client'

import React, { useState, useEffect } from 'react'
import BubbleNodes from './BubbleNodes'

interface Node {
  node_id: string
  label: string
  type: string
  strength: number
  sentiment: number
  intensity: number
  mentionCount: number
  x: number
  y: number
  color: string
  size: number
  connections: string[]
}

interface Edge {
  edge_id: string
  from: string
  to: string
  type: string
  weight: number
  sentiment: number
  context: string
  coOccurrenceCount: number
}

interface GraphData {
  nodes: any[]
  edges: any[]
  stats: {
    nodeCount: number
    edgeCount: number
    strongestNode: string
  }
}

export default function SoulMapView(): React.ReactElement {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  useEffect(() => {
    fetchGraphData()
  }, [])

  const fetchGraphData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/soul-map')
      
      if (!response.ok) {
        throw new Error('Failed to fetch graph data')
      }
      
      const data: GraphData = await response.json()
      setGraphData(data)
      
      // Transform data for visualization
      const transformedNodes = transformNodesToVisualization(data.nodes)
      const transformedEdges = transformEdgesToVisualization(data.edges)
      
      setNodes(transformedNodes)
      setEdges(transformedEdges)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch graph data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load graph data')
      // Fallback to dummy data
      setNodes(getDummyNodes())
      setEdges(getDummyEdges())
    } finally {
      setLoading(false)
    }
  }

  const transformNodesToVisualization = (apiNodes: any[]): Node[] => {
    if (!apiNodes.length) return getDummyNodes()
    
    return apiNodes.map((node, index) => {
      const angle = (index / apiNodes.length) * 2 * Math.PI
      const radius = 150 + (node.strength || 1) * 50
      
      return {
        node_id: node.node_id,
        label: node.label,
        type: node.type,
        strength: node.strength,
        sentiment: node.sentiment,
        intensity: node.intensity,
        mentionCount: node.mentionCount,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        color: getNodeColor(node.type, node.sentiment),
        size: Math.max(40, Math.min(100, 40 + (node.strength || 1) * 8)),
        connections: apiNodes.filter(n => n.node_id !== node.node_id).map(n => n.node_id)
      }
    })
  }

  const transformEdgesToVisualization = (apiEdges: any[]): Edge[] => {
    return apiEdges.map(edge => ({
      edge_id: edge.edge_id,
      from: edge.from,
      to: edge.to,
      type: edge.type,
      weight: edge.weight,
      sentiment: edge.sentiment,
      context: edge.context,
      coOccurrenceCount: edge.coOccurrenceCount
    }))
  }

  const getNodeColor = (type: string, sentiment: number): string => {
    const typeColors = {
      'Person': 'from-purple-400 to-purple-600',
      'Place': 'from-green-400 to-green-600', 
      'Emotion': sentiment < 0 ? 'from-red-400 to-red-600' : 'from-blue-400 to-blue-600',
      'Topic': 'from-amber-400 to-amber-600',
      'Goal': 'from-emerald-400 to-emerald-600',
      'Activity': 'from-indigo-400 to-indigo-600'
    }
    return typeColors[type as keyof typeof typeColors] || 'from-gray-400 to-gray-600'
  }

  const getDummyNodes = (): Node[] => [
    { 
      id: 'loading', 
      label: 'Loading...', 
      type: 'System',
      strength: 5,
      sentiment: 0,
      intensity: 0.5,
      mentionCount: 1,
      x: 400, 
      y: 300, 
      color: 'from-gray-400 to-gray-600', 
      size: 60,
      connections: []
    }
  ]

  const getDummyEdges = (): Edge[] => []

  const getConnectionPath = (from: Node, to: Node): string => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.3
    return `M${from.x},${from.y}A${dr},${dr} 0 0,1 ${to.x},${to.y}`
  }

  const getConnectionOpacity = (edge: Edge): number => {
    if (!hoveredNode && !selectedNode) return 0.3
    if (hoveredNode === edge.from || hoveredNode === edge.to) return 0.8
    if (selectedNode?.node_id === edge.from || selectedNode?.node_id === edge.to) return 0.6
    return 0.1
  }

  const getNodeOpacity = (node: Node): number => {
    if (!hoveredNode && !selectedNode) return 1
    if (hoveredNode === node.node_id) return 1
    if (selectedNode?.node_id === node.node_id) return 1
    if (hoveredNode && node.connections.includes(hoveredNode)) return 0.8
    if (selectedNode && node.connections.includes(selectedNode.node_id)) return 0.8
    return 0.3
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Soul Map</h1>
            <p className="text-slate-600">Explore the connections between your life's key elements</p>
          </div>
        </div>
        
        {loading && (
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-800 font-medium">Loading your Soul Map...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-4 border border-red-200/50">
            <h3 className="font-semibold text-red-800 mb-2">Unable to load Soul Map</h3>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchGraphData}
              className="text-xs text-red-700 hover:text-red-900 transition-colors underline"
            >
              Try again
            </button>
          </div>
        )}

        {selectedNode && !loading && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <h3 className="font-semibold text-slate-800 mb-2">Selected: {selectedNode.label}</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="font-medium">Type:</span> {selectedNode.type}</p>
              <p><span className="font-medium">Strength:</span> {selectedNode.strength.toFixed(1)}/10</p>
              <p><span className="font-medium">Mentions:</span> {selectedNode.mentionCount}</p>
              {selectedNode.sentiment !== 0 && (
                <p><span className="font-medium">Sentiment:</span> {selectedNode.sentiment > 0 ? 'Positive' : 'Negative'} ({selectedNode.sentiment.toFixed(2)})</p>
              )}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Bubble Nodes Visualization */}
      <div className="h-full px-8 pb-8">
        <BubbleNodes />
      </div>
    </div>
  )
}