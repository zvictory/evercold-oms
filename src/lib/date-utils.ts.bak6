import { format, parseISO } from 'date-fns'

// Standard format: dd.mm.yyyy (European format)
export const DATE_FORMAT = 'dd.MM.yyyy'
export const DATE_TIME_FORMAT = 'dd.MM.yyyy, HH:mm'
export const DATE_TIME_SECONDS_FORMAT = 'dd.MM.yyyy, HH:mm:ss'

/**
 * Format a date to dd.mm.yyyy
 * @param date - Date object, ISO string, or Date-like value
 * @returns Formatted date string (e.g., "28.01.2026")
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, DATE_FORMAT)
  } catch (error) {
    console.error('Date formatting error:', error)
    return '-'
  }
}

/**
 * Format a date with time to dd.mm.yyyy, HH:mm
 * @param date - Date object, ISO string, or Date-like value
 * @returns Formatted date-time string (e.g., "28.01.2026, 14:30")
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, DATE_TIME_FORMAT)
  } catch (error) {
    console.error('Date-time formatting error:', error)
    return '-'
  }
}

/**
 * Format a date with time and seconds to dd.mm.yyyy, HH:mm:ss
 * @param date - Date object, ISO string, or Date-like value
 * @returns Formatted date-time string with seconds (e.g., "28.01.2026, 14:30:45")
 */
export function formatDateTimeSeconds(date: Date | string | null | undefined): string {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, DATE_TIME_SECONDS_FORMAT)
  } catch (error) {
    console.error('Date-time-seconds formatting error:', error)
    return '-'
  }
}

/**
 * Convert date to input value format (yyyy-MM-dd) for HTML date inputs
 * @param date - Date object or ISO string
 * @returns Date string in yyyy-MM-dd format
 */
export function toInputDateValue(date: Date | string | null | undefined): string {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'yyyy-MM-dd')
  } catch (error) {
    console.error('Input date conversion error:', error)
    return ''
  }
}

/**
 * Convert date to datetime-local input value format (yyyy-MM-ddTHH:mm)
 * @param date - Date object or ISO string
 * @returns Date-time string in yyyy-MM-ddTHH:mm format
 */
export function toInputDateTimeValue(date: Date | string | null | undefined): string {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, "yyyy-MM-dd'T'HH:mm")
  } catch (error) {
    console.error('Input datetime conversion error:', error)
    return ''
  }
}
