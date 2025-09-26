'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import type {
  PromptHistory,
  PromptComponent,
  StyleModifier,
  PromptExportFormat,
} from '../lib/prompts/types'

interface PromptHistoryProps {
  onPromptLoad?: (history: PromptHistory) => void
  onPromptFavorite?: (historyId: string, favorited: boolean) => void
  onPromptDelete?: (historyId: string) => void
  className?: string
}

interface HistoryItemProps {
  history: PromptHistory
  onLoad: (history: PromptHistory) => void
  onFavorite: (historyId: string, favorited: boolean) => void
  onDelete: (historyId: string) => void
  onEdit: (history: PromptHistory) => void
  isSelected?: boolean
}

// Individual history item component
const HistoryItem: React.FC<HistoryItemProps> = ({
  history,
  onLoad,
  onFavorite,
  onDelete,
  onEdit,
  isSelected = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editNotes, setEditNotes] = useState(history.notes || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleNotesUpdate = () => {
    const updatedHistory = { ...history, notes: editNotes }
    onEdit(updatedHistory)
    setIsEditing(false)
  }

  const handleDeleteConfirm = () => {
    onDelete(history.id)
    setShowDeleteConfirm(false)
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const renderRating = () => {
    if (!history.rating) return null

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${
              i < history.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`
        group bg-white rounded-lg border transition-all duration-200
        ${isSelected
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-600">{formatTimestamp(history.created_at)}</span>
              {history.favorited && (
                <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              {renderRating()}
            </div>
            <p className="text-sm text-gray-800 font-medium leading-relaxed">
              {isExpanded ? history.prompt : truncateText(history.prompt)}
            </p>
            {history.negative_prompt && (
              <p className="text-sm text-red-600 mt-1">
                <span className="text-red-500">Negative:</span>{' '}
                {isExpanded ? history.negative_prompt : truncateText(history.negative_prompt, 60)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => onFavorite(history.id, !history.favorited)}
              className={`p-1 rounded transition-colors ${
                history.favorited
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={history.favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <button
              onClick={() => onLoad(history)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
              title="Load prompt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Components */}
          {history.components.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Components ({history.components.length})</h4>
              <div className="flex flex-wrap gap-1">
                {history.components.map((component, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      component.enabled
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {component.type}: {component.content.substring(0, 20)}
                    {component.content.length > 20 ? '...' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Style Modifiers */}
          {history.style_modifiers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Style Modifiers</h4>
              <div className="flex flex-wrap gap-1">
                {history.style_modifiers.map((modifier, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
                  >
                    {modifier.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generation Parameters */}
          {history.generation_params && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Generation Parameters</h4>
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <pre>{JSON.stringify(history.generation_params, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Generated Images */}
          {history.generated_images && history.generated_images.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Generated Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {history.generated_images.slice(0, 4).map((image, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded">
                    <img
                      src={image}
                      alt={`Generated ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
                  rows={3}
                  placeholder="Add notes about this prompt..."
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditNotes(history.notes || '')
                      setIsEditing(false)
                    }}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNotesUpdate}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-600 flex-1">
                  {history.notes || 'No notes added'}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 text-gray-400 hover:text-blue-600"
                  title="Edit notes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Prompt</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this prompt from your history? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// History manager class
class PromptHistoryManager {
  private history: PromptHistory[] = []
  private storageKey = 'prompt_history'

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.history = JSON.parse(stored).map((item: any) => ({
          ...item,
          created_at: new Date(item.created_at),
        }))
      }
    } catch (error) {
      console.error('Failed to load prompt history:', error)
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history))
    } catch (error) {
      console.error('Failed to save prompt history:', error)
    }
  }

  public addHistory(history: Omit<PromptHistory, 'id' | 'created_at'>): PromptHistory {
    const newHistory: PromptHistory = {
      ...history,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
    }

    this.history.unshift(newHistory)

    // Keep only the latest 100 items
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100)
    }

    this.saveToStorage()
    return newHistory
  }

  public updateHistory(historyId: string, updates: Partial<PromptHistory>): boolean {
    const index = this.history.findIndex(h => h.id === historyId)
    if (index === -1) return false

    this.history[index] = { ...this.history[index], ...updates }
    this.saveToStorage()
    return true
  }

  public deleteHistory(historyId: string): boolean {
    const index = this.history.findIndex(h => h.id === historyId)
    if (index === -1) return false

    this.history.splice(index, 1)
    this.saveToStorage()
    return true
  }

  public getAllHistory(): PromptHistory[] {
    return [...this.history]
  }

  public getFavorites(): PromptHistory[] {
    return this.history.filter(h => h.favorited)
  }

  public searchHistory(query: string): PromptHistory[] {
    const lowerQuery = query.toLowerCase()
    return this.history.filter(
      h =>
        h.prompt.toLowerCase().includes(lowerQuery) ||
        (h.negative_prompt && h.negative_prompt.toLowerCase().includes(lowerQuery)) ||
        (h.notes && h.notes.toLowerCase().includes(lowerQuery))
    )
  }

  public exportHistory(format: PromptExportFormat): string {
    const data = {
      history: this.history,
      exported_at: new Date().toISOString(),
      format: format.format,
    }

    switch (format.format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'text':
        return this.history
          .map(h => `${h.created_at.toISOString()}\n${h.prompt}\n${h.negative_prompt || ''}\n---\n`)
          .join('\n')
      default:
        throw new Error(`Unsupported export format: ${format.format}`)
    }
  }

  public clearHistory(): void {
    this.history = []
    this.saveToStorage()
  }
}

// Main PromptHistory component
const PromptHistory: React.FC<PromptHistoryProps> = ({
  onPromptLoad,
  onPromptFavorite,
  onPromptDelete,
  className,
}) => {
  const [historyManager] = useState(() => new PromptHistoryManager())
  const [history, setHistory] = useState<PromptHistory[]>([])
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'favorites'>('recent')
  const [selectedHistory, setSelectedHistory] = useState<PromptHistory | null>(null)

  // Load history on mount
  useEffect(() => {
    setHistory(historyManager.getAllHistory())
  }, [historyManager])

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = history

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = historyManager.searchHistory(searchQuery)
    }

    // Apply category filter
    if (filter === 'favorites') {
      filtered = filtered.filter(h => h.favorited)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'favorites':
          if (a.favorited && !b.favorited) return -1
          if (!a.favorited && b.favorited) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [history, historyManager, filter, searchQuery, sortBy])

  const handlePromptLoad = useCallback((historyItem: PromptHistory) => {
    setSelectedHistory(historyItem)
    onPromptLoad?.(historyItem)
  }, [onPromptLoad])

  const handlePromptFavorite = useCallback((historyId: string, favorited: boolean) => {
    historyManager.updateHistory(historyId, { favorited })
    setHistory(historyManager.getAllHistory())
    onPromptFavorite?.(historyId, favorited)
  }, [historyManager, onPromptFavorite])

  const handlePromptDelete = useCallback((historyId: string) => {
    historyManager.deleteHistory(historyId)
    setHistory(historyManager.getAllHistory())
    if (selectedHistory?.id === historyId) {
      setSelectedHistory(null)
    }
    onPromptDelete?.(historyId)
  }, [historyManager, selectedHistory, onPromptDelete])

  const handlePromptEdit = useCallback((updatedHistory: PromptHistory) => {
    historyManager.updateHistory(updatedHistory.id, updatedHistory)
    setHistory(historyManager.getAllHistory())
  }, [historyManager])

  const handleExport = useCallback(() => {
    const exportData = historyManager.exportHistory({ format: 'json', include_metadata: true, include_history: true, include_templates: false })
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt_history_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [historyManager])

  const handleClearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all prompt history? This action cannot be undone.')) {
      historyManager.clearHistory()
      setHistory([])
      setSelectedHistory(null)
    }
  }, [historyManager])

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prompt History</h2>
            <p className="text-gray-600">
              Review and reuse your previous prompts
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-blue-800">
            <div className="flex items-center space-x-6">
              <span>📚 {history.length} total prompts</span>
              <span>⭐ {history.filter(h => h.favorited).length} favorites</span>
              <span>🎯 {history.filter(h => h.rating && h.rating >= 4).length} highly rated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'favorites')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Prompts</option>
              <option value="favorites">Favorites Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating' | 'favorites')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="favorites">Favorites First</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">
                {searchQuery ? 'No prompts found' : 'No prompt history yet'}
              </p>
              <p className="text-sm">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Start creating prompts to build your history'
                }
              </p>
            </div>
          </div>
        ) : (
          filteredHistory.map(historyItem => (
            <HistoryItem
              key={historyItem.id}
              history={historyItem}
              onLoad={handlePromptLoad}
              onFavorite={handlePromptFavorite}
              onDelete={handlePromptDelete}
              onEdit={handlePromptEdit}
              isSelected={selectedHistory?.id === historyItem.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default PromptHistory