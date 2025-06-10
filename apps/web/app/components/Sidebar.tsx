'use client'

import React, { useState } from 'react'

interface SidebarProps {
  currentPage: 'journal' | 'database' | 'ai-search' | 'soul-map'
  onPageChange: (page: 'journal' | 'database' | 'ai-search' | 'soul-map') => void
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      id: 'journal' as const,
      label: 'Journal',
      icon: '📝',
      description: 'Write & reflect'
    },
    {
      id: 'database' as const, 
      label: 'Database',
      icon: '🗃️',
      description: 'View entries'
    },
    {
      id: 'ai-search' as const,
      label: 'AI Search',
      icon: '🔍',
      description: 'Connect thoughts'
    },
    {
      id: 'soul-map' as const,
      label: 'Soul Map',
      icon: '🌐',
      description: 'Explore connections'
    }
  ]

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-800">Reflective Journal</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          Thoughtful journaling companion
        </div>
      )}
    </div>
  )
}