import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ImageUpload from './ImageUpload'
import { AppProvider } from '../contexts/AppContext'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  )
}

describe('ImageUpload', () => {
  it('renders upload area with correct text', () => {
    renderWithProvider(<ImageUpload />)
    expect(screen.getByText('Upload an image')).toBeInTheDocument()
    expect(screen.getByText('Drag and drop or click to select')).toBeInTheDocument()
  })

  it('shows supported file types', () => {
    renderWithProvider(<ImageUpload />)
    expect(screen.getByText(/Supports: JPEG, PNG, WebP, GIF, BMP/)).toBeInTheDocument()
  })

  it('has a choose image button', () => {
    renderWithProvider(<ImageUpload />)
    expect(screen.getByText('Choose Image')).toBeInTheDocument()
  })

  it('has file input with proper attributes', () => {
    renderWithProvider(<ImageUpload />)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('type', 'file')
  })
})