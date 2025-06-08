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
    <div className="h-full flex items-start justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 overflow-y-auto">
      <div className="max-w-4xl w-full min-h-0">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden max-h-none">
          {/* Header */}
          <div className="px-8 py-8 border-b border-slate-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-semibold text-slate-800 mb-2">Memory Explorer</h2>
            <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
              Ask questions about your past experiences and discover insights from your journal history
            </p>
          </div>

          {/* Search Form */}
          <div className="p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-3">
                  What would you like to explore?
                </label>
                <div className="relative">
                  <textarea
                    id="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., When was the last time I felt overwhelmed? How did I handle difficult situations before?"
                    className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-200 bg-white/70 backdrop-blur-sm text-slate-800 placeholder-slate-400"
                    rows={4}
                    disabled={loading}
                  />
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className={`px-10 py-4 rounded-2xl font-medium transition-all duration-200 ${
                    loading || !query.trim()
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-purple-200 hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Searching memories...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                      Explore Memories
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          {error && (
            <div className="px-8 pb-8">
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-red-800 font-semibold">Search Error</span>
                </div>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {searchResult && (
            <div className="px-8 pb-8 space-y-8">
              {/* AI Response */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">AI Insights</h3>
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                  {searchResult.response}
                </div>
              </div>

              {/* Related Entries */}
              {searchResult.related_entries && searchResult.related_entries.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.99C4.58 7 2.5 9.09 2.5 11.5S4.58 16 6.99 16H11v-1.9H6.99c-1.71 0-3.09-1.39-3.09-3.1zM8 13h8v-2H8v2zm9.01-6H13v1.9h4.01c1.71 0 3.09 1.39 3.09 3.1s-1.38 3.1-3.09 3.1H13V17h4.01C19.42 17 21.5 14.91 21.5 12.5S19.42 8 17.01 8z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Related Memories</h3>
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {searchResult.related_entries.length} found
                    </span>
                  </div>
                  <div className="space-y-4">
                    {searchResult.related_entries.map((entry, index) => (
                      <div
                        key={entry.journal_entry_id}
                        className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 hover:bg-white/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                              {formatDate(entry.created_at)}
                            </span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            entry.similarity_score > 0.8 
                              ? 'text-emerald-700 bg-emerald-100' 
                              : entry.similarity_score > 0.6 
                              ? 'text-amber-700 bg-amber-100' 
                              : 'text-slate-600 bg-slate-100'
                          }`}>
                            {Math.round(entry.similarity_score * 100)}% match
                          </div>
                        </div>
                        <div className="text-slate-700 leading-relaxed">
                          {entry.content.length > 400 
                            ? entry.content.substring(0, 400) + '...'
                            : entry.content
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.related_entries && searchResult.related_entries.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-slate-700 mb-2">No Related Memories Found</h4>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Try exploring different emotions, situations, or time periods from your past experiences.
                  </p>
                </div>
              )}
            </div>
          )}

          {!searchResult && !error && !loading && (
            <div className="px-8 pb-8">
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <svg className="w-12 h-12 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">Ready to Explore</h3>
                <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Ask me anything about your past experiences, emotions, or situations. I'll search through your journal entries and provide thoughtful insights.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}