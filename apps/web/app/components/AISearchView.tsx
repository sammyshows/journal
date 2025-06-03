'use client'

import React, { useState } from 'react'

interface SearchResult {
  id: number
  content: string
  created_at: string
  similarity_score: number
  metadata: any
}

interface SearchResponse {
  query: string
  response: string
  related_entries: SearchResult[]
}

export default function AISearchView(): React.ReactElement {
  const [query, setQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResult(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSimilarityColor = (score: number): string => {
    if (score > 0.8) return 'text-green-600 bg-green-50'
    if (score > 0.6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Memory Search</h2>
          <p className="text-gray-600">
            Ask questions about your past experiences and I'll find related journal entries using vector similarity.
          </p>
        </div>

        {/* Search Form */}
        <div className="p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to explore from your past?
              </label>
              <textarea
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., When was the last time I felt overwhelmed like this? How did I handle stress at work before?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </span>
              ) : (
                'Search Memories'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {searchResult && (
            <div className="p-6 space-y-6">
              {/* AI Response */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  🤖 AI Insights
                </h3>
                <div className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                  {searchResult.response}
                </div>
              </div>

              {/* Related Entries */}
              {searchResult.related_entries && searchResult.related_entries.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🔗 Related Journal Entries
                    <span className="text-sm font-normal text-gray-500">
                      ({searchResult.related_entries.length} found)
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {searchResult.related_entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Entry #{entry.id}</span>
                            <span className="text-sm text-gray-500">{formatDate(entry.created_at)}</span>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getSimilarityColor(entry.similarity_score)}`}>
                            {Math.round(entry.similarity_score * 100)}% match
                          </div>
                        </div>
                        <div className="text-gray-800 leading-relaxed">
                          {entry.content.length > 300 
                            ? entry.content.substring(0, 300) + '...'
                            : entry.content
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.related_entries && searchResult.related_entries.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p>No related entries found for your query.</p>
                    <p className="text-sm mt-1">Try asking about different experiences or feelings.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!searchResult && !error && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🧠</div>
                <p className="text-xl mb-2">Search Your Memory</p>
                <p className="text-sm max-w-md">
                  Use AI to find connections between your current thoughts and past journal entries.
                  Ask about feelings, experiences, or situations you've been through before.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}