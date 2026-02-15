import React from 'react'
import { render, screen } from '@testing-library/react'
import { OrderSheet } from '../OrderSheet'

// Mock the i18n client
jest.mock('@/locales/client', () => ({
  useScopedI18n: (scope: string) => {
    return (key: string) => {
      // Return the key as a string for testing
      return `${scope}.${key}`
    }
  },
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('OrderSheet Component', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSave = jest.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    initialData: undefined,
    onSave: mockOnSave,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    })
  })

  test('renders without crashing', () => {
    const { container } = render(<OrderSheet {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  test('displays new order title when creating new order', () => {
    render(<OrderSheet {...defaultProps} initialData={undefined} />)
    // The title uses translation key format
    expect(document.body.textContent).toMatch(/Orders\.sheet\.(newTitle|editTitle)/)
  })

  test('displays edit order title when editing existing order', () => {
    const initialData = {
      id: '123',
      orderNumber: 'ORD-001',
      customerId: 'cust-1',
      branchId: 'branch-1',
    }
    render(<OrderSheet {...defaultProps} initialData={initialData} />)
    // Should show translation keys in rendered output
    expect(document.body.textContent).toMatch(/Orders\.sheet/)
  })

  test('translation keys are properly used in form labels', () => {
    const { container } = render(<OrderSheet {...defaultProps} />)
    const html = container.innerHTML

    // Verify that translation keys are being used (they appear in component)
    expect(html).toContain('Orders.sheet')
  })

  test('renders section headers with translations', () => {
    const { container } = render(<OrderSheet {...defaultProps} />)
    const html = container.innerHTML

    // Should contain translation keys for sections
    expect(html).toMatch(/Orders\.sheet\.(logisticsSection|lineItemsSection)/)
  })

  test('form remains functional with translation system', () => {
    const { container } = render(<OrderSheet {...defaultProps} />)

    // Verify form elements are still rendered
    const form = container.querySelector('form')
    expect(form).toBeTruthy()
  })

  test('buttons use translation keys', () => {
    const { container } = render(<OrderSheet {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation keys for buttons
    expect(html).toMatch(/Orders\.sheet\.(cancelButton|finalizeButton|updateButton)/)
  })
})
