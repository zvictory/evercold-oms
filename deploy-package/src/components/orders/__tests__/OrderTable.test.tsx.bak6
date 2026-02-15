import React from 'react'
import { render, screen } from '@testing-library/react'
import { OrderTable } from '../OrderTable'

// Mock the i18n client
jest.mock('@/locales/client', () => ({
  useI18n: () => (key: string) => {
    // Return translation key path for testing
    return key.includes('.') ? key : `test.${key}`
  },
}))

// Mock the invoice modal
jest.mock('../InvoiceGeneratorModal', () => ({
  InvoiceGeneratorModal: () => <div data-testid="invoice-modal">Invoice Modal</div>,
}))

describe('OrderTable Component', () => {
  const mockOnEdit = jest.fn()
  const mockOnSelectionChange = jest.fn()

  const mockOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      branch: 'K001',
      branchCode: 'K001',
      date: new Date('2026-01-31'),
      products: { ice3kg: 5, ice1kg: 10 },
      weight: 20,
      amount: 150000,
      status: 'NEW',
    },
  ]

  const defaultProps = {
    orders: mockOrders,
    loading: false,
    error: null,
    onEdit: mockOnEdit,
    selection: [],
    onSelectionChange: mockOnSelectionChange,
  }

  test('renders without crashing', () => {
    const { container } = render(<OrderTable {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  test('displays order table headers', () => {
    const { container } = render(<OrderTable {...defaultProps} />)
    const html = container.innerHTML

    // Should contain table header elements
    expect(html).toContain('<table')
    expect(html).toContain('thead')
  })

  test('uses translation keys for table headers', () => {
    const { container } = render(<OrderTable {...defaultProps} />)
    const html = container.innerHTML

    // Should use translation keys for headers
    expect(html).toMatch(/Orders\.table\.(tableHeaders|id|branch|date)/)
  })

  test('displays order data in rows', () => {
    const { container } = render(<OrderTable {...defaultProps} />)
    const html = container.innerHTML

    // Should display order number
    expect(html).toContain('ORD-001')
  })

  test('dropdown menu uses translation keys', () => {
    const { container } = render(<OrderTable {...defaultProps} />)
    const html = container.innerHTML

    // Should contain dropdown menu with translation keys
    expect(html).toMatch(/Orders\.table\.(actionsMenu|editDetails|deleteOrder|downloadInvoice)/)
  })

  test('renders checkbox for row selection', () => {
    const { container } = render(<OrderTable {...defaultProps} />)
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')

    // Should have at least one checkbox per row plus header select all
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  test('handles empty state', () => {
    const { container } = render(<OrderTable {...defaultProps} orders={[]} />)
    const html = container.innerHTML

    // Should show empty state
    expect(html).toMatch(/Orders\.table\.emptyTitle/)
  })

  test('displays loading state when loading', () => {
    const { container } = render(<OrderTable {...defaultProps} loading={true} />)
    const html = container.innerHTML

    // Should show loading indicator
    expect(html).toMatch(/Loading|Загрузка/)
  })

  test('displays error state when error occurs', () => {
    const errorMsg = 'Test error message'
    const { container } = render(<OrderTable {...defaultProps} error={errorMsg} />)
    const html = container.innerHTML

    // Should show error message
    expect(html).toContain('Error')
  })
})
