/**
 * Uzbek-standard number formatting utilities.
 *
 * Uses non-breaking space (\u00A0) as thousand separator
 * to match CIS / Uzbek conventions: "14 513.40"
 *
 * All monetary/quantity columns should use `tabular-nums` CSS class
 * alongside these formatters for proper alignment.
 */

const NBSP = '\u00A0' // non-breaking space

/**
 * Format a number with thousand separators and fixed decimals.
 *
 * @param value  - The number to format
 * @param decimals - Decimal places (default 2)
 * @returns Formatted string, e.g. "14 513.40"
 */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0'

  const fixed = Math.abs(value).toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')

  const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)

  const sign = value < 0 ? '-' : ''
  return decPart !== undefined
    ? `${sign}${withSeparators}.${decPart}`
    : `${sign}${withSeparators}`
}

/**
 * Format a monetary value: "14 513.40"
 */
export function formatPrice(value: number): string {
  return formatNumber(value, 2)
}

/**
 * Format a monetary value with currency suffix: "14 513.40 сўм"
 */
export function formatCurrency(value: number): string {
  return `${formatPrice(value)}${NBSP}сўм`
}

/**
 * Format a quantity (integer, no decimals): "1 500"
 */
export function formatQuantity(value: number): string {
  return formatNumber(Math.round(value), 0)
}
