'use client'

import React, { useState, useEffect } from 'react'

interface JournalEntry {
  id: number
  user_id: string
  content: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

interface UserProfile {
  id: number
  user_id: string
  name: string | null
  created_at: string
  updated_at: string
  reflection_preferences: Record<string, any>
  emotional_patterns: Record<string, any>
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

type DataType = 'journal-entries' | 'users'

export default function DatabaseView(): React.ReactElement {
  const [selectedDataType, setSelectedDataType] = useState<DataType>('journal-entries')
  const [data, setData] = useState<(JournalEntry | UserProfile)[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dataTypes = [
    {
      id: 'journal-entries' as const,
      label: 'Journal Entries',
      icon: '📝',
      description: 'View all journal entries'
    },
    {
      id: 'users' as const,
      label: 'Users',
      icon: '👤',
      description: 'View user profiles'
    }
  ]

  useEffect(() => {
    fetchData(selectedDataType)
  }, [selectedDataType])

  const fetchData = async (dataType: DataType, offset: number = 0) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/${dataType}?limit=50&offset=${offset}`)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await response.json()
      setData(result.data || [])
      setPagination(result.pagination || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...'
    }
    return String(value)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const getColumns = () => {
    if (data.length === 0) return []
    const firstItem = data[0]
    if (!firstItem) return []
    return Object.keys(firstItem)
  }

  return (
    <div className="flex h-full">
      {/* Data Type Selector */}
      <div className="min-w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Types</h3>
        <div className="space-y-2">
          {dataTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedDataType(type.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                selectedDataType === type.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{type.icon}</span>
              <div>
                <div className="font-medium">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {dataTypes.find(t => t.id === selectedDataType)?.label}
            </h2>
            <div className="flex items-center gap-3">
              {pagination && (
                <span className="text-sm text-gray-600">
                  {pagination.total} total entries
                </span>
              )}
              <button
                onClick={() => fetchData(selectedDataType)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-500">Error: {error}</div>
              </div>
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">No data found</div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {getColumns().map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                      >
                        {column.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {getColumns().map((column) => {
                        const value = (row as any)[column]
                        return (
                          <td key={column} className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                            {column.includes('_at') ? (
                              <span className="text-gray-600">
                                {formatDate(value)}
                              </span>
                            ) : column === 'content' ? (
                              <div className="max-w-md">
                                <div className="truncate" title={value}>
                                  {formatValue(value)}
                                </div>
                              </div>
                            ) : (
                              <div className="break-words">
                                {formatValue(value)}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* Pagination Controls */}
            {!loading && !error && pagination && pagination.total > 0 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchData(selectedDataType, Math.max(0, pagination.offset - pagination.limit))}
                    disabled={pagination.offset === 0 || loading}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchData(selectedDataType, pagination.offset + pagination.limit)}
                    disabled={!pagination.hasMore || loading}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}