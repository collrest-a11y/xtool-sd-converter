import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText('xTool Art Converter')).toBeInTheDocument()
  })

  it('renders the upload area when no image is uploaded', () => {
    render(<App />)
    expect(screen.getByText('Upload an image')).toBeInTheDocument()
  })

  it('shows instructions section', () => {
    render(<App />)
    expect(screen.getByText('How to Use')).toBeInTheDocument()
  })

  it('renders all three instruction steps', () => {
    render(<App />)
    expect(screen.getByText('Upload Image')).toBeInTheDocument()
    expect(screen.getByText('Choose Style')).toBeInTheDocument()
    expect(screen.getByText('Convert')).toBeInTheDocument()
  })
})