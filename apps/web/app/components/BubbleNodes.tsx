'use client'

import React, { useState, useEffect, useRef } from 'react'

interface TopNode {
  node_id: string
  label: string
  type: string
  edge_count: number
  total_weight: number
  entry_count: number
  score: number
  connection_weight?: number
  connection_type?: string
  created_at: string
}

interface Position {
  x: number
  y: number
}

interface AnimatedBubbleProps {
  node: TopNode
  position: Position
  size: number
  isCenter: boolean
  isVisible: boolean
  onClick: () => void
  animationDelay: number
}

function AnimatedBubble({ 
  node, 
  position, 
  size, 
  isCenter, 
  isVisible, 
  onClick, 
  animationDelay 
}: AnimatedBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [floatOffset, setFloatOffset] = useState({ x: 0, y: 0 })

  // Color schemes based on node type
  const getColorScheme = (type: string) => {
    const schemes = {
      emotion: { from: '#ff6b6b', to: '#ee5a24', shadow: 'rgba(238, 90, 36, 0.3)' },
      theme: { from: '#4834d4', to: '#686de0', shadow: 'rgba(72, 52, 212, 0.3)' },
      person: { from: '#00d2d3', to: '#01a3a4', shadow: 'rgba(0, 210, 211, 0.3)' },
      event: { from: '#ff9ff3', to: '#f368e0', shadow: 'rgba(243, 104, 224, 0.3)' },
      genre: { from: '#feca57', to: '#ff9f43', shadow: 'rgba(255, 159, 67, 0.3)' },
      process: { from: '#1dd1a1', to: '#10ac84', shadow: 'rgba(29, 209, 161, 0.3)' },
      relationship: { from: '#fd79a8', to: '#e84393', shadow: 'rgba(232, 67, 147, 0.3)' },
      occupation: { from: '#a29bfe', to: '#6c5ce7', shadow: 'rgba(108, 92, 231, 0.3)' },
      entity: { from: '#fdcb6e', to: '#e17055', shadow: 'rgba(225, 112, 85, 0.3)' }
    }
    return schemes[type as keyof typeof schemes] || schemes.theme
  }

  const colorScheme = getColorScheme(node.type)

  // Floating animation
  useEffect(() => {
    if (!isVisible || isCenter) return

    const animate = () => {
      const time = Date.now() / 1000
      const floatRange = isCenter ? 2 : 8
      const offsetX = Math.sin(time * 0.5 + animationDelay) * floatRange
      const offsetY = Math.cos(time * 0.3 + animationDelay) * (floatRange * 0.75)
      
      setFloatOffset({ x: offsetX, y: offsetY })
      requestAnimationFrame(animate)
    }
    
    animate()
  }, [isVisible, isCenter, animationDelay])

  return (
    <div
      ref={bubbleRef}
      className={`
        absolute flex items-center justify-center rounded-full cursor-pointer
        transition-all duration-700 ease-out hover:scale-110
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
        ${isCenter ? 'z-20' : 'z-10'}
      `}
      style={{
        left: `${position.x + (isCenter ? 0 : floatOffset.x)}px`,
        top: `${position.y + (isCenter ? 0 : floatOffset.y)}px`,
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(135deg, ${colorScheme.from} 0%, ${colorScheme.to} 100%)`,
        boxShadow: `
          0 ${isCenter ? '16px 48px' : '8px 32px'} ${colorScheme.shadow},
          inset 0 2px 4px rgba(255, 255, 255, 0.3),
          inset 0 -2px 4px rgba(0, 0, 0, 0.1)
        `,
        transform: isCenter ? 'scale(1.2)' : 'scale(1)'
      }}
      onClick={onClick}
    >
      {/* Bubble highlight */}
      <div
        className="absolute top-2 left-2 rounded-full bg-white opacity-40"
        style={{
          width: `${size * 0.25}px`,
          height: `${size * 0.25}px`,
        }}
      />
      
      {/* Node label */}
      <div className="text-center px-2">
        <div 
          className="text-white font-semibold leading-tight"
          style={{ 
            fontSize: size > 80 ? '16px' : '12px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          {node.label}
        </div>
        <div 
          className="text-white opacity-80 font-medium mt-1"
          style={{ 
            fontSize: size > 80 ? '12px' : '9px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          {node.type}
        </div>
      </div>

      {/* Score indicator */}
      <div className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
        <span className="text-xs font-bold text-gray-800">
          {Math.round(node.connection_weight || node.score)}
        </span>
      </div>
    </div>
  )
}

function ConnectionTether({ 
  from, 
  to, 
  label, 
  isVisible 
}: { 
  from: Position; 
  to: Position; 
  label: string; 
  isVisible: boolean;
}) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI
  const length = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2))
  
  return (
    <div 
      className={`absolute transition-opacity duration-500 ${isVisible ? 'opacity-60' : 'opacity-0'}`}
      style={{
        left: `${from.x}px`,
        top: `${from.y}px`,
        width: `${length}px`,
        height: '2px',
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        zIndex: 5
      }}
    >
      {/* Tether label */}
      <div 
        className="absolute whitespace-nowrap text-xs font-medium text-purple-700 bg-white/80 px-2 py-1 rounded-full shadow-sm"
        style={{
          left: `${length / 2}px`,
          top: '-20px',
          transform: `translateX(-50%) rotate(${-angle}deg)`
        }}
      >
        {label}
      </div>
    </div>
  )
}

export default function BubbleNodes(): React.ReactElement {
  const [nodes, setNodes] = useState<TopNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TopNode | null>(null)
  const [relatedNodes, setRelatedNodes] = useState<TopNode[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const centerX = 350 // Center of our 700px container
  const centerY = 450 // Center of our 400px container

  useEffect(() => {
    fetchTopNodes()
  }, [])

  const fetchTopNodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/top-nodes?limit=5')
      if (!response.ok) {
        throw new Error('Failed to fetch top nodes')
      }
      const result = await response.json()
      setNodes(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedNodes = async (nodeId: string) => {
    try {
      setLoadingRelated(true)
      const response = await fetch(`/api/top-nodes?limit=5&relatedTo=${nodeId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch related nodes')
      }
      const result = await response.json()
      setRelatedNodes(result.data || [])
    } catch (err) {
      console.error('Error fetching related nodes:', err)
      setRelatedNodes([])
    } finally {
      setLoadingRelated(false)
    }
  }

  const handleBubbleClick = async (node: TopNode) => {
    if (selectedNode?.node_id === node.node_id) {
      // Deselect - return to ring
      setSelectedNode(null)
      setRelatedNodes([])
    } else {
      // Select new node
      setSelectedNode(node)
      await fetchRelatedNodes(node.node_id)
    }
  }

  const getRingPosition = (index: number, total: number, radius: number = 200): Position => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2 // Start from top
    return {
      x: centerX + Math.cos(angle) * radius - 40, // -40 to center bubble
      y: centerY + Math.sin(angle) * radius - 40
    }
  }

  const getSurroundingPosition = (index: number, total: number, radius: number = 200): Position => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2
    return {
      x: centerX + Math.cos(angle) * radius - 40,
      y: centerY + Math.sin(angle) * radius - 40
    }
  }

  const getCenterPosition = (): Position => {
    return {
      x: centerX - 65, // 65 = radius of bubble
      y: centerY - 65
    }
  }

  const maxScore = Math.max(...nodes.map(n => n.score), 1)

  const getNodeSize = (node: TopNode, isCenter: boolean = false): number => {
    const baseSize = 130 + ((node.score / maxScore) * 40)
    const size = Math.max(100, Math.min(130, baseSize))
    return isCenter ? size * 1.2 : size
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex space-x-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading nodes: {error}</p>
          <button
            onClick={fetchTopNodes}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No nodes found</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl" />
      
      {/* Main container */}
      <div 
        ref={containerRef}
        className="relative h-full overflow-hidden"
        style={{ width: '700px', margin: '0 auto' }}
      >
        {/* Title */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <h3 className="text-xl font-semibold text-gray-800 text-center">
            {selectedNode ? `Exploring: ${selectedNode.label}` : 'Your Mind Map'}
          </h3>
          {loadingRelated && (
            <div className="flex items-center justify-center mt-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm text-purple-600">Finding connections...</span>
            </div>
          )}
        </div>

        {/* Connection tethers */}
        {selectedNode && relatedNodes.map((relatedNode, index) => (
          <ConnectionTether
            key={`tether-${relatedNode.node_id}`}
            from={getCenterPosition()}
            to={getSurroundingPosition(index, relatedNodes.length)}
            label={relatedNode.connection_type === 'incoming' ? 'influences' : 'influenced by'}
            isVisible={!loadingRelated}
          />
        ))}

        {/* Main node bubbles */}
        {nodes.map((node, index) => {
          const isSelected = selectedNode?.node_id === node.node_id
          const isHidden = selectedNode && !isSelected
          
          return (
            <AnimatedBubble
              key={node.node_id}
              node={node}
              position={isSelected ? getCenterPosition() : getRingPosition(index, nodes.length)}
              size={getNodeSize(node, isSelected)}
              isCenter={isSelected}
              isVisible={!isHidden}
              onClick={() => handleBubbleClick(node)}
              animationDelay={index}
            />
          )
        })}

        {/* Related nodes */}
        {selectedNode && relatedNodes.map((relatedNode, index) => (
          <AnimatedBubble
            key={`related-${relatedNode.node_id}`}
            node={relatedNode}
            position={getSurroundingPosition(index, relatedNodes.length)}
            size={getNodeSize(relatedNode)}
            isCenter={false}
            isVisible={!loadingRelated}
            onClick={() => handleBubbleClick(relatedNode)}
            animationDelay={index + 1}
          />
        ))}

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-30">
          <p className="text-sm text-gray-600">
            {selectedNode 
              ? 'Click the center node to return • Click related nodes to explore further'
              : 'Click any bubble to explore its connections'
            }
          </p>
        </div>
      </div>
    </div>
  )
}