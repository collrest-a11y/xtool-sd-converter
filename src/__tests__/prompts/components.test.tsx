/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import '@testing-library/jest-dom'

import PromptBuilder from '../../components/PromptBuilder'
import PromptTemplates from '../../components/PromptTemplates'
import PromptHistory from '../../components/PromptHistory'
import type { PromptTemplate, PromptHistory as PromptHistoryType } from '../../lib/prompts/types'

// Mock localStorage for history component
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock URL.createObjectURL for export functionality
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-url'),
})

// Mock the crypto API for ID generation
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint32Array([123456789])),
  },
})

// Wrapper component with DnD provider
const DndWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
)

describe('PromptBuilder Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    expect(screen.getByText('Prompt Builder')).toBeInTheDocument()
    expect(screen.getByText('Build sophisticated prompts with drag-and-drop components and smart suggestions.')).toBeInTheDocument()
  })

  it('should display add component buttons', () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    expect(screen.getByText('+ Subject')).toBeInTheDocument()
    expect(screen.getByText('+ Style')).toBeInTheDocument()
    expect(screen.getByText('+ Lighting')).toBeInTheDocument()
    expect(screen.getByText('+ Detail')).toBeInTheDocument()
  })

  it('should add components when buttons are clicked', async () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    const subjectButton = screen.getByText('+ Subject')
    fireEvent.click(subjectButton)

    await waitFor(() => {
      expect(screen.getByText('New subject')).toBeInTheDocument()
    })

    expect(screen.getByText('1 components • 1 enabled')).toBeInTheDocument()
  })

  it('should show generated prompt', async () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    // Add a component
    const subjectButton = screen.getByText('+ Subject')
    fireEvent.click(subjectButton)

    await waitFor(() => {
      const promptTextarea = screen.getByDisplayValue(/New subject/)
      expect(promptTextarea).toBeInTheDocument()
    })
  })

  it('should handle style modifiers', async () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    const highQualityChip = screen.getByText('High Quality')
    expect(highQualityChip).toBeInTheDocument()

    fireEvent.click(highQualityChip)

    await waitFor(() => {
      // The chip should appear active (different styling)
      expect(highQualityChip.closest('button')).toHaveClass('bg-blue-500')
    })
  })

  it('should allow component editing', async () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    // Add a component
    const subjectButton = screen.getByText('+ Subject')
    fireEvent.click(subjectButton)

    await waitFor(() => {
      expect(screen.getByText('New subject')).toBeInTheDocument()
    })

    // Find and click edit button (should appear on hover)
    const componentElement = screen.getByText('New subject').closest('div')
    if (componentElement) {
      // Simulate hover to show edit button
      fireEvent.mouseEnter(componentElement)

      await waitFor(() => {
        const editButton = screen.getByTitle('Edit')
        fireEvent.click(editButton)
      })

      // Should show editing interface
      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toBeInTheDocument()
        expect(textarea).toHaveValue('New subject')
      })
    }
  })

  it('should call onPromptChange when prompt is generated', async () => {
    const mockOnPromptChange = jest.fn()

    render(
      <DndWrapper>
        <PromptBuilder onPromptChange={mockOnPromptChange} />
      </DndWrapper>
    )

    const subjectButton = screen.getByText('+ Subject')
    fireEvent.click(subjectButton)

    await waitFor(() => {
      expect(mockOnPromptChange).toHaveBeenCalled()
      const [prompt, negativePrompt] = mockOnPromptChange.mock.calls[0]
      expect(typeof prompt).toBe('string')
      expect(typeof negativePrompt).toBe('string')
    })
  })

  it('should show validation results', async () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    // Add some components to trigger validation
    const subjectButton = screen.getByText('+ Subject')
    fireEvent.click(subjectButton)

    await waitFor(() => {
      expect(screen.getByText('Validation')).toBeInTheDocument()
      expect(screen.getByText('Quality Score')).toBeInTheDocument()
    })
  })
})

describe('PromptTemplates Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(<PromptTemplates />)

    expect(screen.getByText('Prompt Templates')).toBeInTheDocument()
    expect(screen.getByText('Discover and use professionally crafted prompt templates')).toBeInTheDocument()
  })

  it('should display template statistics', () => {
    render(<PromptTemplates />)

    expect(screen.getByText(/templates available/)).toBeInTheDocument()
    expect(screen.getByText(/highly rated/)).toBeInTheDocument()
    expect(screen.getByText(/trending/)).toBeInTheDocument()
  })

  it('should show search and filter controls', () => {
    render(<PromptTemplates />)

    expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument()
    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByText('Sort by:')).toBeInTheDocument()
  })

  it('should display template cards', () => {
    render(<PromptTemplates />)

    // Should display some template cards with default templates
    expect(screen.getByText('Impressionist Portrait')).toBeInTheDocument()
    expect(screen.getByText('Cyberpunk Character')).toBeInTheDocument()
  })

  it('should handle category filtering', async () => {
    render(<PromptTemplates />)

    const artStylesButton = screen.getByText('art styles')
    fireEvent.click(artStylesButton)

    await waitFor(() => {
      // Button should appear active
      expect(artStylesButton.closest('button')).toHaveClass('bg-blue-500')
    })
  })

  it('should handle search input', async () => {
    render(<PromptTemplates />)

    const searchInput = screen.getByPlaceholderText('Search templates...')
    fireEvent.change(searchInput, { target: { value: 'portrait' } })

    await waitFor(() => {
      expect(searchInput).toHaveValue('portrait')
    })
  })

  it('should call onTemplateSelect when template is clicked', async () => {
    const mockOnTemplateSelect = jest.fn()

    render(<PromptTemplates onTemplateSelect={mockOnTemplateSelect} />)

    const templateCard = screen.getByText('Impressionist Portrait').closest('div')
    if (templateCard) {
      fireEvent.click(templateCard)

      await waitFor(() => {
        expect(mockOnTemplateSelect).toHaveBeenCalled()
        const selectedTemplate = mockOnTemplateSelect.mock.calls[0][0]
        expect(selectedTemplate.name).toBe('Impressionist Portrait')
      })
    }
  })

  it('should handle view mode toggle', async () => {
    render(<PromptTemplates />)

    const listViewButton = screen.getByTitle('List view')
    fireEvent.click(listViewButton)

    await waitFor(() => {
      expect(listViewButton).toHaveClass('bg-blue-500')
    })
  })

  it('should show sort options', () => {
    render(<PromptTemplates />)

    const sortSelect = screen.getByDisplayValue('Rating')
    expect(sortSelect).toBeInTheDocument()

    fireEvent.change(sortSelect, { target: { value: 'usage' } })
    expect(sortSelect).toHaveValue('usage')
  })
})

describe('PromptHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('[]') // Empty history initially
  })

  it('should render without crashing', () => {
    render(<PromptHistory />)

    expect(screen.getByText('Prompt History')).toBeInTheDocument()
    expect(screen.getByText('Review and reuse your previous prompts')).toBeInTheDocument()
  })

  it('should show empty state when no history', () => {
    render(<PromptHistory />)

    expect(screen.getByText('No prompt history yet')).toBeInTheDocument()
    expect(screen.getByText('Start creating prompts to build your history')).toBeInTheDocument()
  })

  it('should display statistics', () => {
    render(<PromptHistory />)

    expect(screen.getByText(/total prompts/)).toBeInTheDocument()
    expect(screen.getByText(/favorites/)).toBeInTheDocument()
    expect(screen.getByText(/highly rated/)).toBeInTheDocument()
  })

  it('should show search and filter controls', () => {
    render(<PromptHistory />)

    expect(screen.getByPlaceholderText('Search prompts...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Prompts')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Most Recent')).toBeInTheDocument()
  })

  it('should handle export functionality', () => {
    render(<PromptHistory />)

    const exportButton = screen.getByText('Export')
    fireEvent.click(exportButton)

    // Should call localStorage and create download
    expect(localStorageMock.getItem).toHaveBeenCalled()
  })

  it('should handle clear all functionality', () => {
    // Mock window.confirm
    const mockConfirm = jest.fn(() => true)
    window.confirm = mockConfirm

    render(<PromptHistory />)

    const clearButton = screen.getByText('Clear All')
    fireEvent.click(clearButton)

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to clear all prompt history? This action cannot be undone.'
    )
  })

  it('should display history items when available', () => {
    const mockHistory = JSON.stringify([
      {
        id: 'test-history-1',
        prompt: 'test prompt content',
        negative_prompt: 'test negative',
        components: [],
        style_modifiers: [],
        favorited: false,
        created_at: new Date().toISOString(),
      }
    ])

    localStorageMock.getItem.mockReturnValue(mockHistory)

    render(<PromptHistory />)

    expect(screen.getByText('test prompt content')).toBeInTheDocument()
  })

  it('should handle filtering by favorites', async () => {
    const mockHistory = JSON.stringify([
      {
        id: 'test-history-1',
        prompt: 'favorite prompt',
        components: [],
        style_modifiers: [],
        favorited: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'test-history-2',
        prompt: 'regular prompt',
        components: [],
        style_modifiers: [],
        favorited: false,
        created_at: new Date().toISOString(),
      }
    ])

    localStorageMock.getItem.mockReturnValue(mockHistory)

    render(<PromptHistory />)

    const filterSelect = screen.getByDisplayValue('All Prompts')
    fireEvent.change(filterSelect, { target: { value: 'favorites' } })

    await waitFor(() => {
      expect(screen.getByText('favorite prompt')).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    const mockHistory = JSON.stringify([
      {
        id: 'test-history-1',
        prompt: 'portrait of a woman',
        components: [],
        style_modifiers: [],
        favorited: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'test-history-2',
        prompt: 'landscape photography',
        components: [],
        style_modifiers: [],
        favorited: false,
        created_at: new Date().toISOString(),
      }
    ])

    localStorageMock.getItem.mockReturnValue(mockHistory)

    render(<PromptHistory />)

    const searchInput = screen.getByPlaceholderText('Search prompts...')
    fireEvent.change(searchInput, { target: { value: 'portrait' } })

    await waitFor(() => {
      expect(screen.getByText('portrait of a woman')).toBeInTheDocument()
      expect(screen.queryByText('landscape photography')).not.toBeInTheDocument()
    })
  })

  it('should call onPromptLoad when prompt is loaded', async () => {
    const mockOnPromptLoad = jest.fn()
    const mockHistory = JSON.stringify([
      {
        id: 'test-history-1',
        prompt: 'test prompt',
        components: [],
        style_modifiers: [],
        favorited: false,
        created_at: new Date().toISOString(),
      }
    ])

    localStorageMock.getItem.mockReturnValue(mockHistory)

    render(<PromptHistory onPromptLoad={mockOnPromptLoad} />)

    // Find and click the load button (upload icon)
    const loadButton = screen.getByTitle('Load prompt')
    fireEvent.click(loadButton)

    await waitFor(() => {
      expect(mockOnPromptLoad).toHaveBeenCalled()
      const loadedHistory = mockOnPromptLoad.mock.calls[0][0]
      expect(loadedHistory.prompt).toBe('test prompt')
    })
  })
})

describe('Component Integration', () => {
  it('should integrate PromptBuilder with PromptTemplates', async () => {
    let currentPrompt = ''
    let selectedTemplate: PromptTemplate | null = null

    const handlePromptChange = (prompt: string) => {
      currentPrompt = prompt
    }

    const handleTemplateSelect = (template: PromptTemplate) => {
      selectedTemplate = template
    }

    render(
      <div>
        <PromptTemplates onTemplateSelect={handleTemplateSelect} />
        <DndWrapper>
          <PromptBuilder
            initialTemplate={selectedTemplate || undefined}
            onPromptChange={handlePromptChange}
          />
        </DndWrapper>
      </div>
    )

    // Select a template
    const templateCard = screen.getByText('Impressionist Portrait').closest('div')
    if (templateCard) {
      fireEvent.click(templateCard)

      await waitFor(() => {
        expect(selectedTemplate).not.toBeNull()
        expect(selectedTemplate?.name).toBe('Impressionist Portrait')
      })
    }
  })

  it('should integrate PromptBuilder with PromptHistory', async () => {
    const mockHistory: PromptHistoryType[] = []
    const mockHistoryJson = JSON.stringify(mockHistory)
    localStorageMock.getItem.mockReturnValue(mockHistoryJson)

    let loadedHistory: PromptHistoryType | null = null

    const handlePromptLoad = (history: PromptHistoryType) => {
      loadedHistory = history
    }

    render(
      <div>
        <PromptHistory onPromptLoad={handlePromptLoad} />
        <DndWrapper>
          <PromptBuilder />
        </DndWrapper>
      </div>
    )

    // Components should render without errors even with empty history
    expect(screen.getByText('Prompt History')).toBeInTheDocument()
    expect(screen.getByText('Prompt Builder')).toBeInTheDocument()
  })
})

describe('Accessibility', () => {
  it('should have proper ARIA labels and roles', () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    // Check for proper button roles and labels
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)

    // Check for proper form elements
    const textareas = screen.getAllByRole('textbox')
    textareas.forEach(textarea => {
      expect(textarea).toBeInTheDocument()
    })
  })

  it('should support keyboard navigation', async () => {
    render(
      <DndWrapper>
        <PromptBuilder />
      </DndWrapper>
    )

    const firstButton = screen.getByText('+ Subject')

    // Focus the button
    firstButton.focus()
    expect(firstButton).toHaveFocus()

    // Should be able to activate with Enter key
    fireEvent.keyDown(firstButton, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('New subject')).toBeInTheDocument()
    })
  })

  it('should have proper heading hierarchy', () => {
    render(<PromptTemplates />)

    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toHaveTextContent('Prompt Templates')
  })
})

describe('Error Handling', () => {
  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw an error
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })

    // Component should still render without crashing
    expect(() => {
      render(<PromptHistory />)
    }).not.toThrow()

    expect(screen.getByText('Prompt History')).toBeInTheDocument()
  })

  it('should handle invalid JSON in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')

    expect(() => {
      render(<PromptHistory />)
    }).not.toThrow()

    expect(screen.getByText('No prompt history yet')).toBeInTheDocument()
  })
})