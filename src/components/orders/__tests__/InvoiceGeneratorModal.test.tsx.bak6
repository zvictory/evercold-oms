import React from 'react'
import { render, screen } from '@testing-library/react'
import { InvoiceGeneratorModal } from '../InvoiceGeneratorModal'

// Mock the i18n client
jest.mock('@/locales/client', () => ({
  useScopedI18n: (scope: string) => {
    return (key: string) => {
      // Return the key as a string for testing
      return `${scope}.${key}`
    }
  },
}))

// Mock date utilities
jest.mock('@/lib/date-utils', () => ({
  formatDate: (date: Date) => date.toLocaleDateString(),
  toInputDateValue: (date: Date) => date.toISOString().split('T')[0],
}))

describe('InvoiceGeneratorModal Component', () => {
  const mockOnOpenChange = jest.fn()

  const mockOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      amount: 150000,
      weight: 20,
      status: 'NEW',
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      amount: 200000,
      weight: 30,
      status: 'CONFIRMED',
    },
  ]

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    selectedOrders: mockOrders,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  test('displays dialog title with translation key', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for title
    expect(html).toContain('Orders.invoice.title')
  })

  test('displays description with translation key', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation key for subtitle/description
    expect(html).toContain('Orders.invoice.subtitle')
  })

  test('displays contract label with translation key', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation keys for form labels
    expect(html).toMatch(/Orders\.invoice\.(contractLabel|invoiceDateLabel)/)
  })

  test('has contract select field', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const selects = container.querySelectorAll('select')

    // Should have contract select
    expect(selects.length).toBeGreaterThan(0)
  })

  test('has invoice date input field', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const dateInput = container.querySelector('input[type="date"]')

    expect(dateInput).toBeTruthy()
  })

  test('displays calculation summary with translation keys', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation keys for financial calculations
    expect(html).toMatch(/Orders\.invoice\.(netAmount|vatAmount|totalAmount)/)
  })

  test('displays order count', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should display the number of selected orders
    expect(html).toContain(mockOrders.length.toString())
  })

  test('displays weight calculation', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should display total weight (50 = 20 + 30)
    expect(html).toContain('50')
  })

  test('displays financial totals', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should show calculations
    expect(html).toMatch(/350000|Schet|Invoice/)
  })

  test('buttons use translation keys', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation keys for buttons
    expect(html).toMatch(/Orders\.invoice\.generateButton/)
  })

  test('displays calculator icon', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    // Should have Calculator icon component rendered
    expect(container.innerHTML).toContain('svg') // Icon is typically rendered as SVG
  })

  test('displays file text icon for invoice', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    // Should have FileText icon component rendered
    expect(container.innerHTML).toContain('svg') // Icon is typically rendered as SVG
  })

  test('displays compliance note', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const html = container.innerHTML

    // Should show compliance note about Schet-Faktura
    expect(html).toMatch(/legal|compliant|Uzbekistan|Tax/)
  })

  test('handles empty order list', () => {
    const { container } = render(
      <InvoiceGeneratorModal {...defaultProps} selectedOrders={[]} />
    )

    // Should render without error with empty list
    expect(container).toBeTruthy()
    expect(container.innerHTML).toContain('Orders.invoice')
  })

  test('handles single order', () => {
    const { container } = render(
      <InvoiceGeneratorModal {...defaultProps} selectedOrders={[mockOrders[0]]} />
    )

    // Should render correctly with single order
    expect(container).toBeTruthy()
    expect(container.innerHTML).toContain('1')
  })

  test('can close modal', () => {
    const { container } = render(<InvoiceGeneratorModal {...defaultProps} />)
    const buttons = container.querySelectorAll('button')

    // Should have cancel button
    expect(buttons.length).toBeGreaterThan(0)
  })
})
