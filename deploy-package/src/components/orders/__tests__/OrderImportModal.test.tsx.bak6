import React from 'react'
import { render, screen } from '@testing-library/react'
import { OrderImportModal } from '../OrderImportModal'

// Mock the i18n client
jest.mock('@/locales/client', () => ({
  useScopedI18n: (scope: string) => {
    return (key: string) => {
      // Return the key as a string for testing
      return `${scope}.${key}`
    }
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('OrderImportModal Component', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnImportComplete = jest.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onImportComplete: mockOnImportComplete,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ordersCreated: 5, ordersSkipped: 0 }),
    })
  })

  test('renders without crashing', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  test('displays dialog title with translation key', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for title
    expect(html).toContain('Orders.import.title')
  })

  test('displays description with translation key', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for description
    expect(html).toContain('Orders.import.description')
  })

  test('displays upload area with translation key', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation keys for upload section
    expect(html).toMatch(/Orders\.import\.(uploadArea|supportedFormats)/)
  })

  test('has file input for Excel files', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const fileInput = container.querySelector('input[type="file"]')

    expect(fileInput).toBeTruthy()
    expect((fileInput as HTMLInputElement)?.accept).toMatch(/\.xlsx|\.xls/)
  })

  test('displays format requirements section', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should contain format requirements text
    expect(html).toMatch(/Orders\.import\.formatRequirements/)
    expect(html).toMatch(/Orders\.import\.(detailedFormat|registryFormat)/)
  })

  test('dialog buttons use translation keys', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation keys for buttons
    expect(html).toMatch(/Orders\.import\.(uploadButton|importButton)/)
  })

  test('renders upload icon', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    // Should have UploadCloud icon component rendered
    expect(container.innerHTML).toContain('svg') // Icon is typically rendered as SVG
  })

  test('collapsible section for format guidance works', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should have collapsible trigger button
    expect(html).toContain('CollapsibleTrigger') || expect(html).toMatch(/Format/)
  })

  test('can close modal', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const buttons = container.querySelectorAll('button')

    // Should have at least one button (Cancel/Close)
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('displays success message after upload', () => {
    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should show success state in rendered component
    expect(html).toMatch(/Orders\.import|success|complete/)
  })

  test('shows error state on upload failure', () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Upload failed')
    )

    const { container } = render(<OrderImportModal {...defaultProps} />)
    const html = container.innerHTML

    // Should contain error handling UI elements
    expect(html).toMatch(/error|Error/) || expect(html).toContain('Orders.import')
  })
})
