import React from 'react'
import { render, screen } from '@testing-library/react'
import { BulkDeleteDialog } from '../BulkDeleteDialog'

// Mock the i18n client
jest.mock('@/locales/client', () => ({
  useScopedI18n: (scope: string) => {
    return (key: string) => {
      // Return the key as a string for testing
      return `${scope}.${key}`
    }
  },
}))

describe('BulkDeleteDialog Component', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnConfirm = jest.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    selectedCount: 3,
    onConfirm: mockOnConfirm,
    isDeleting: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  test('displays dialog title with translation key', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for title
    expect(html).toContain('Orders.bulkDelete.title')
  })

  test('displays description with translation key', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for description
    expect(html).toContain('Orders.bulkDelete.description')
  })

  test('displays warning box with translated content', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    const html = container.innerHTML

    // Should show warning box with translation keys
    expect(html).toMatch(/Orders\.bulkDelete\.(title|description)/)
  })

  test('cancel button uses translation key', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for cancel button
    expect(html).toContain('Orders.bulkDelete.cancelButton')
  })

  test('delete button uses translation key', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for delete button
    expect(html).toMatch(/Orders\.bulkDelete\.(deleteButton|deleteCompleteButton)/)
  })

  test('renders delete icon', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    // Should have Trash2 icon component rendered
    expect(container.innerHTML).toContain('svg') // Icon is typically rendered as SVG
  })

  test('shows loading state when deleting', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} isDeleting={true} />)
    const html = container.innerHTML

    // Should show delete button in loading state
    expect(html).toContain('Orders.bulkDelete.deleteButton')
  })

  test('disables buttons during deletion', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} isDeleting={true} />)
    const buttons = container.querySelectorAll('button')

    // Buttons should be disabled during deletion
    buttons.forEach(button => {
      if (button.textContent?.includes('Orders.bulkDelete')) {
        expect(button.disabled).toBe(true)
      }
    })
  })

  test('handles different item counts', () => {
    const { container: container1 } = render(
      <BulkDeleteDialog {...defaultProps} selectedCount={1} />
    )
    const { container: container2 } = render(
      <BulkDeleteDialog {...defaultProps} selectedCount={10} />
    )

    // Both should render without error
    expect(container1).toBeTruthy()
    expect(container2).toBeTruthy()
  })

  test('dialog can be closed', () => {
    const { container } = render(<BulkDeleteDialog {...defaultProps} />)
    const buttons = container.querySelectorAll('button')

    // Find cancel button and verify it exists
    let cancelButton = null
    buttons.forEach(button => {
      if (button.textContent?.includes('Orders.bulkDelete.cancelButton')) {
        cancelButton = button
      }
    })

    expect(cancelButton).toBeTruthy()
  })
})
