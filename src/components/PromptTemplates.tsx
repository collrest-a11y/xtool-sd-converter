'use client'

import React, { useState, useMemo, useCallback } from 'react'
import type {
  PromptTemplate,
  PromptCategory,
  PromptSearchFilter,
  PromptCollection,
} from '../lib/prompts/types'
import { PromptTemplateManager } from '../lib/prompts/templates'

interface PromptTemplatesProps {
  onTemplateSelect?: (template: PromptTemplate) => void
  onTemplatePreview?: (template: PromptTemplate) => void
  selectedCategory?: PromptCategory
  className?: string
}

interface TemplateCardProps {
  template: PromptTemplate
  onSelect: (template: PromptTemplate) => void
  onPreview: (template: PromptTemplate) => void
  isSelected?: boolean
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  isSelected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getCategoryColor = (category: PromptCategory): string => {
    const colors = {
      art_styles: 'bg-purple-100 text-purple-800 border-purple-200',
      photography: 'bg-blue-100 text-blue-800 border-blue-200',
      illustrations: 'bg-green-100 text-green-800 border-green-200',
      portraits: 'bg-pink-100 text-pink-800 border-pink-200',
      landscapes: 'bg-teal-100 text-teal-800 border-teal-200',
      abstract: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      anime_manga: 'bg-rose-100 text-rose-800 border-rose-200',
      realistic: 'bg-gray-100 text-gray-800 border-gray-200',
      fantasy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      sci_fi: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      historical: 'bg-amber-100 text-amber-800 border-amber-200',
      minimalist: 'bg-slate-100 text-slate-800 border-slate-200',
      experimental: 'bg-violet-100 text-violet-800 border-violet-200',
      custom: 'bg-orange-100 text-orange-800 border-orange-200',
    }
    return colors[category] || colors.custom
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${
              i < fullStars
                ? 'text-yellow-400 fill-current'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-xs text-gray-600">({rating.toFixed(1)})</span>
      </div>
    )
  }

  return (
    <div
      className={`
        group relative bg-white rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(template)}
    >
      {/* Template Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {template.description}
            </p>
          </div>
          <div className="flex items-center space-x-1 ml-4">
            {isHovered && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(template)
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
            {template.category.replace('_', ' ')}
          </span>
          {renderStars(template.rating)}
        </div>
      </div>

      {/* Template Content Preview */}
      <div className="p-4">
        <div className="space-y-2">
          <div className="text-xs text-gray-600 uppercase tracking-wide">Components ({template.components.length})</div>
          <div className="flex flex-wrap gap-1">
            {template.components.slice(0, 6).map((component, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
              >
                {component.type}
              </span>
            ))}
            {template.components.length > 6 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-600">
                +{template.components.length - 6} more
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Tags</div>
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 4).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 4 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-600">
                  +{template.tags.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-3">
            {template.usage_count !== undefined && (
              <span>🔥 {template.usage_count} uses</span>
            )}
            {template.author && (
              <span>👤 {template.author}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {template.public && (
              <span className="text-green-600" title="Public template">🌐</span>
            )}
            <time dateTime={template.created_at.toISOString()} title="Created date">
              {template.created_at.toLocaleDateString()}
            </time>
          </div>
        </div>
      </div>
    </div>
  )
}

// Search and filter controls
interface FilterControlsProps {
  filter: PromptSearchFilter
  onFilterChange: (filter: PromptSearchFilter) => void
  categories: PromptCategory[]
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  onFilterChange,
  categories,
}) => {
  const handleSearchChange = (searchText: string) => {
    onFilterChange({ ...filter, search_text: searchText })
  }

  const handleCategoryToggle = (category: PromptCategory) => {
    const currentCategories = filter.category || []
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category]

    onFilterChange({
      ...filter,
      category: newCategories.length > 0 ? newCategories : undefined
    })
  }

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    onFilterChange({
      ...filter,
      sort_by: sortBy as any,
      sort_order: sortOrder as any,
    })
  }

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={filter.search_text || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter.category?.includes(category)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              value={filter.sort_by || 'rating'}
              onChange={(e) => handleSortChange(e.target.value, filter.sort_order || 'desc')}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="rating">Rating</option>
              <option value="usage">Usage</option>
              <option value="recent">Recent</option>
              <option value="name">Name</option>
            </select>
          </div>
          <button
            onClick={() => handleSortChange(filter.sort_by || 'rating', filter.sort_order === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={`Sort ${filter.sort_order === 'asc' ? 'descending' : 'ascending'}`}
          >
            <svg className={`w-4 h-4 transition-transform ${filter.sort_order === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Main PromptTemplates component
const PromptTemplates: React.FC<PromptTemplatesProps> = ({
  onTemplateSelect,
  onTemplatePreview,
  selectedCategory,
  className,
}) => {
  const [templateManager] = useState(() => new PromptTemplateManager())
  const [filter, setFilter] = useState<PromptSearchFilter>({
    sort_by: 'rating',
    sort_order: 'desc',
    category: selectedCategory ? [selectedCategory] : undefined,
  })
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get all available categories
  const availableCategories: PromptCategory[] = [
    'art_styles', 'photography', 'illustrations', 'portraits', 'landscapes',
    'abstract', 'anime_manga', 'realistic', 'fantasy', 'sci_fi',
    'historical', 'minimalist', 'experimental'
  ]

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = templateManager.getAllTemplates()

    // Apply search filter
    if (filter.search_text) {
      templates = templateManager.searchTemplates(filter.search_text)
    }

    // Apply category filter
    if (filter.category && filter.category.length > 0) {
      templates = templates.filter(template =>
        filter.category!.includes(template.category)
      )
    }

    // Apply public filter
    if (filter.public_only) {
      templates = templates.filter(template => template.public)
    }

    // Apply rating filter
    if (filter.rating_min) {
      templates = templates.filter(template =>
        template.rating && template.rating >= filter.rating_min!
      )
    }

    // Sort templates
    templates.sort((a, b) => {
      const multiplier = filter.sort_order === 'asc' ? 1 : -1

      switch (filter.sort_by) {
        case 'rating':
          return ((b.rating || 0) - (a.rating || 0)) * multiplier
        case 'usage':
          return ((b.usage_count || 0) - (a.usage_count || 0)) * multiplier
        case 'recent':
          return (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) * multiplier
        case 'name':
          return a.name.localeCompare(b.name) * multiplier
        default:
          return 0
      }
    })

    return templates
  }, [templateManager, filter])

  const handleTemplateSelect = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template)
    onTemplateSelect?.(template)

    // Increment usage count
    const updatedTemplate = {
      ...template,
      usage_count: (template.usage_count || 0) + 1,
      updated_at: new Date(),
    }
    templateManager.updateTemplate(updatedTemplate)
  }, [onTemplateSelect, templateManager])

  const handleTemplatePreview = useCallback((template: PromptTemplate) => {
    onTemplatePreview?.(template)
  }, [onTemplatePreview])

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prompt Templates</h2>
            <p className="text-gray-600">
              Discover and use professionally crafted prompt templates
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-blue-800">
            <div className="flex items-center space-x-6">
              <span>📚 {filteredTemplates.length} templates available</span>
              <span>⭐ {templateManager.getTopRatedTemplates(5).length} highly rated</span>
              <span>🔥 {templateManager.getPopularTemplates(5).length} trending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <FilterControls
        filter={filter}
        onFilterChange={setFilter}
        categories={availableCategories}
      />

      {/* Templates Grid */}
      <div className={`
        ${viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }
      `}>
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No templates found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleTemplateSelect}
              onPreview={handleTemplatePreview}
              isSelected={selectedTemplate?.id === template.id}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredTemplates.length > 20 && (
        <div className="text-center mt-8">
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Load More Templates
          </button>
        </div>
      )}
    </div>
  )
}

export default PromptTemplates