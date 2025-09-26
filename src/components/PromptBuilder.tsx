'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import type {
  PromptComponent,
  PromptBuilderState,
  PromptValidationResult,
  StyleModifier,
  PromptTemplate,
  DragDropItem,
} from '../lib/prompts/types'
import { PromptBuilderEngine } from '../lib/prompts/prompt-builder'
import { PromptAnalyzer } from '../lib/prompts/analyzer'

interface PromptBuilderProps {
  initialTemplate?: PromptTemplate
  onPromptChange?: (prompt: string, negativePrompt: string) => void
  onStateChange?: (state: PromptBuilderState) => void
  className?: string
}

const DRAG_TYPES = {
  COMPONENT: 'component',
  MODIFIER: 'modifier',
  TEMPLATE: 'template',
}

// Draggable component item
interface DraggableComponentProps {
  component: PromptComponent
  index: number
  onUpdate: (component: PromptComponent) => void
  onRemove: (componentId: string) => void
  onMove: (dragIndex: number, hoverIndex: number) => void
  isNegative?: boolean
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  index,
  onUpdate,
  onRemove,
  onMove,
  isNegative = false,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(component.content)
  const [editWeight, setEditWeight] = useState(component.weight || 1.0)

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPES.COMPONENT,
    item: { id: component.id, index, type: component.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: DRAG_TYPES.COMPONENT,
    hover: (item: { id: string; index: number }) => {
      if (!ref.current || item.index === index) return

      onMove(item.index, index)
      item.index = index
    },
  })

  drag(drop(ref))

  const handleSave = () => {
    const updatedComponent: PromptComponent = {
      ...component,
      content: editContent,
      weight: editWeight,
    }
    onUpdate(updatedComponent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(component.content)
    setEditWeight(component.weight || 1.0)
    setIsEditing(false)
  }

  const handleToggle = () => {
    onUpdate({ ...component, enabled: !component.enabled })
  }

  const weightColor = component.weight ?
    component.weight > 1.0 ? 'text-green-600' :
    component.weight < 1.0 ? 'text-red-600' :
    'text-gray-600' : 'text-gray-600'

  return (
    <div
      ref={ref}
      className={`
        group relative bg-white rounded-lg border p-3 mb-2 transition-all duration-200
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${component.enabled ? 'border-blue-200 shadow-sm' : 'border-gray-200 bg-gray-50'}
        ${isNegative ? 'border-red-200 bg-red-50' : ''}
        hover:shadow-md cursor-move
      `}
    >
      {/* Component Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggle}
            className={`w-4 h-4 rounded border ${
              component.enabled
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-200 border-gray-300'
            }`}
          >
            {component.enabled && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(component.type)}`}>
            {component.type}
          </span>
          {component.weight && component.weight !== 1.0 && (
            <span className={`text-xs font-mono ${weightColor}`}>
              {component.weight.toFixed(1)}x
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(component.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Component Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
            rows={2}
            placeholder="Enter component content..."
          />
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">Weight:</span>
              <input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(parseFloat(e.target.value) || 1.0)}
                min="0.1"
                max="2.0"
                step="0.1"
                className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-sm ${component.enabled ? 'text-gray-800' : 'text-gray-500'}`}>
          {component.content}
        </p>
      )}
    </div>
  )
}

// Modifier chip component
interface ModifierChipProps {
  modifier: StyleModifier
  isActive: boolean
  onToggle: (modifier: StyleModifier) => void
}

const ModifierChip: React.FC<ModifierChipProps> = ({ modifier, isActive, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(modifier)}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all
        ${isActive
          ? 'bg-blue-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
      title={modifier.prompt_addition}
    >
      {modifier.name}
    </button>
  )
}

// Main PromptBuilder component
const PromptBuilder: React.FC<PromptBuilderProps> = ({
  initialTemplate,
  onPromptChange,
  onStateChange,
  className,
}) => {
  const [engine] = useState(() => new PromptBuilderEngine())
  const [analyzer] = useState(() => new PromptAnalyzer())
  const [state, setState] = useState<PromptBuilderState>(engine.getState())
  const [validation, setValidation] = useState<PromptValidationResult | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [availableModifiers] = useState<StyleModifier[]>([
    {
      id: 'high_quality',
      name: 'High Quality',
      category: 'quality',
      prompt_addition: 'high quality, detailed, masterpiece',
    },
    {
      id: 'photorealistic',
      name: 'Photorealistic',
      category: 'quality',
      prompt_addition: 'photorealistic, hyperrealistic, lifelike',
    },
    {
      id: 'artistic',
      name: 'Artistic',
      category: 'quality',
      prompt_addition: 'artistic, creative, expressive',
    },
  ])

  // Update state when engine changes
  useEffect(() => {
    const newState = engine.getState()
    setState(newState)
    onStateChange?.(newState)

    // Generate prompt and validate
    const { prompt, negative_prompt } = engine.generatePrompt()
    onPromptChange?.(prompt, negative_prompt)

    if (newState.validation_enabled) {
      const validationResult = analyzer.analyzePrompt(
        newState.components,
        newState.negative_components,
        newState.active_modifiers
      )
      setValidation(validationResult)
    }
  }, [engine, analyzer, onPromptChange, onStateChange])

  // Load initial template
  useEffect(() => {
    if (initialTemplate) {
      engine.loadTemplate(initialTemplate)
      setState(engine.getState())
    }
  }, [initialTemplate, engine])

  const handleAddComponent = useCallback((type: string, content: string) => {
    const componentType = type as PromptComponent['type']
    engine.addComponent({
      type: componentType,
      content,
      weight: 1.0,
      enabled: true,
    })
    setState(engine.getState())
  }, [engine])

  const handleUpdateComponent = useCallback((component: PromptComponent) => {
    engine.updateComponent(component)
    setState(engine.getState())
  }, [engine])

  const handleRemoveComponent = useCallback((componentId: string) => {
    engine.removeComponent(componentId)
    setState(engine.getState())
  }, [engine])

  const handleMoveComponent = useCallback((dragIndex: number, hoverIndex: number) => {
    const component = state.components[dragIndex]
    if (component) {
      engine.moveComponent(component.id, hoverIndex)
      setState(engine.getState())
    }
  }, [engine, state.components])

  const handleToggleModifier = useCallback((modifier: StyleModifier) => {
    const isActive = state.active_modifiers.some(m => m.id === modifier.id)
    if (isActive) {
      engine.removeModifier(modifier.id)
    } else {
      engine.applyModifier(modifier)
    }
    setState(engine.getState())
  }, [engine, state.active_modifiers])

  const currentPrompt = engine.generatePrompt()

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`max-w-4xl mx-auto p-6 ${className || ''}`}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prompt Builder</h2>
          <p className="text-gray-600">
            Build sophisticated prompts with drag-and-drop components and smart suggestions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Components */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Component Section */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-3">Add Components</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: 'subject', label: 'Subject' },
                  { type: 'style', label: 'Style' },
                  { type: 'medium', label: 'Medium' },
                  { type: 'lighting', label: 'Lighting' },
                  { type: 'camera', label: 'Camera' },
                  { type: 'mood', label: 'Mood' },
                  { type: 'color', label: 'Color' },
                  { type: 'detail', label: 'Detail' },
                ].map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => handleAddComponent(type, `New ${label.toLowerCase()}`)}
                    className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Positive Components */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Positive Prompt Components</h3>
                <p className="text-sm text-gray-600">
                  {state.components.length} components • {state.components.filter(c => c.enabled).length} enabled
                </p>
              </div>
              <div className="p-4">
                {state.components.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No components added yet.</p>
                    <p className="text-sm">Add components above to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.components.map((component, index) => (
                      <DraggableComponent
                        key={component.id}
                        component={component}
                        index={index}
                        onUpdate={handleUpdateComponent}
                        onRemove={handleRemoveComponent}
                        onMove={handleMoveComponent}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Negative Components */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Negative Prompt Components</h3>
                <p className="text-sm text-gray-600">
                  {state.negative_components.length} components • {state.negative_components.filter(c => c.enabled).length} enabled
                </p>
              </div>
              <div className="p-4">
                <button
                  onClick={() => handleAddComponent('negative', 'low quality, blurry')}
                  className="w-full p-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 mb-4"
                >
                  + Add Negative Component
                </button>
                {state.negative_components.length > 0 && (
                  <div className="space-y-2">
                    {state.negative_components.map((component, index) => (
                      <DraggableComponent
                        key={component.id}
                        component={component}
                        index={index}
                        onUpdate={handleUpdateComponent}
                        onRemove={handleRemoveComponent}
                        onMove={handleMoveComponent}
                        isNegative
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Style Modifiers */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-3">Style Modifiers</h3>
              <div className="flex flex-wrap gap-2">
                {availableModifiers.map(modifier => (
                  <ModifierChip
                    key={modifier.id}
                    modifier={modifier}
                    isActive={state.active_modifiers.some(m => m.id === modifier.id)}
                    onToggle={handleToggleModifier}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview and Validation */}
          <div className="space-y-6">
            {/* Generated Prompt */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-3">Generated Prompt</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 uppercase tracking-wide">Positive</label>
                  <textarea
                    value={currentPrompt.prompt}
                    readOnly
                    className="w-full mt-1 p-3 text-sm border border-gray-300 rounded bg-gray-50 resize-none"
                    rows={4}
                  />
                </div>
                {currentPrompt.negative_prompt && (
                  <div>
                    <label className="text-xs text-gray-600 uppercase tracking-wide">Negative</label>
                    <textarea
                      value={currentPrompt.negative_prompt}
                      readOnly
                      className="w-full mt-1 p-3 text-sm border border-gray-300 rounded bg-red-50 resize-none"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Validation Panel */}
            {validation && (
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Validation</h3>
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showValidation ? 'Hide' : 'Show'} Details
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Quality Score</span>
                    <span className="text-sm font-semibold">{validation.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        validation.score >= 80 ? 'bg-green-500' :
                        validation.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${validation.score}%` }}
                    />
                  </div>
                </div>

                {showValidation && (
                  <div className="space-y-3">
                    {validation.warnings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-600 mb-2">Warnings</h4>
                        <ul className="space-y-1">
                          {validation.warnings.slice(0, 3).map((warning, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start">
                              <span className="text-orange-500 mr-1">⚠</span>
                              {warning.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-600 mb-2">Suggestions</h4>
                        <ul className="space-y-1">
                          {validation.suggestions.slice(0, 3).map((suggestion, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-1">💡</span>
                              {suggestion.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

// Helper function to get type-specific colors
function getTypeColor(type: string): string {
  const colors = {
    subject: 'bg-purple-100 text-purple-800',
    style: 'bg-blue-100 text-blue-800',
    medium: 'bg-green-100 text-green-800',
    lighting: 'bg-yellow-100 text-yellow-800',
    camera: 'bg-indigo-100 text-indigo-800',
    mood: 'bg-pink-100 text-pink-800',
    color: 'bg-red-100 text-red-800',
    composition: 'bg-teal-100 text-teal-800',
    detail: 'bg-orange-100 text-orange-800',
    negative: 'bg-red-100 text-red-800',
    custom: 'bg-gray-100 text-gray-800',
  }
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export default PromptBuilder