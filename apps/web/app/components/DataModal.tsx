'use client'

import React, { useEffect, useRef } from 'react'

interface DataModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: Record<string, any>
  type: 'journal-entry' | 'user' | 'node' | 'edge'
}

export default function DataModal({ isOpen, onClose, title, data, type }: DataModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>
    }
    
    if (key.includes('_at') && typeof value === 'string') {
      return (
        <span className="text-gray-600">
          {new Date(value).toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
      )
    }
    
    if (typeof value === 'object') {
      return (
        <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-40 whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }
    
    if (typeof value === 'string' && value.length > 500) {
      return (
        <div className="space-y-2">
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm leading-relaxed max-h-60 overflow-auto">
            {value}
          </div>
          <div className="text-xs text-gray-500">
            {value.length} characters
          </div>
        </div>
      )
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'true' : 'false'}
        </span>
      )
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono text-blue-600">{value}</span>
    }
    
    return <span className="break-words">{String(value)}</span>
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'journal-entry': return '📝'
      case 'user': return '👤'
      case 'node': return '🧠'
      case 'edge': return '🔗'
      default: return '📄'
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'journal-entry': return 'bg-blue-500'
      case 'user': return 'bg-green-500'
      case 'node': return 'bg-purple-500'
      case 'edge': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getSpecialFields = () => {
    switch (type) {
      case 'journal-entry':
        return ['content', 'metadata', 'embedding']
      case 'node':
        return ['label', 'type']
      case 'edge':
        return ['from_label', 'to_label', 'weight', 'timestamps']
      default:
        return []
    }
  }

  const specialFields = getSpecialFields()
  const regularFields = Object.keys(data).filter(key => !specialFields.includes(key))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200 overflow-scroll"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${getTypeColor()} flex items-center justify-center text-white text-xl`}>
              {getTypeIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 capitalize">{type.replace('-', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Special Fields */}
            {specialFields.length > 0 && (
              <div className="space-y-4">
                {specialFields.map((key) => (
                  data[key] !== undefined && (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <div className="pl-1">
                        {formatValue(key, data[key])}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Regular Fields */}
            {regularFields.length > 0 && (
              <>
                {specialFields.length > 0 && <hr className="border-gray-200" />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regularFields.map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <div className="pl-1">
                        {formatValue(key, data[key])}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}