"use client"

import * as React from "react"
import flatpickr from "flatpickr"
import type { Instance } from "flatpickr/dist/types/instance"
import { DateRange } from "react-day-picker"
import { useCurrentLocale, useI18n } from '@/locales/client'
import { getFlatpickrLocale } from '@/lib/flatpickr-locales'
import "flatpickr/dist/flatpickr.min.css"

interface DateRangePickersProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

/**
 * Dual Flatpickr Date Pickers for Date Range Selection
 *
 * Replaces react-tailwindcss-datepicker with two separate flatpickr instances.
 * Maintains backward compatibility with DateRange API { from, to }.
 *
 * Features:
 * - Date validation: To date cannot be before From date
 * - Multi-language support (4 languages)
 * - Ice & Steel design system styling
 * - European date format (dd.mm.yyyy)
 */
export function DateRangePickers({
  className,
  date,
  onDateChange,
}: DateRangePickersProps) {
  const t = useI18n()
  const currentLocale = useCurrentLocale()

  // Refs for input elements and flatpickr instances
  const fromInputRef = React.useRef<HTMLInputElement>(null)
  const toInputRef = React.useRef<HTMLInputElement>(null)
  const fromPickerRef = React.useRef<Instance | null>(null)
  const toPickerRef = React.useRef<Instance | null>(null)

  // Refs to store current date values (solves stale closure bug)
  const fromDateRef = React.useRef<Date | undefined>(date?.from)
  const toDateRef = React.useRef<Date | undefined>(date?.to)

  // Internal state to track selected dates
  const [fromDate, setFromDate] = React.useState<Date | undefined>(date?.from)
  const [toDate, setToDate] = React.useState<Date | undefined>(date?.to)

  // Helper functions to update both ref and state atomically
  const updateFromDate = React.useCallback((newDate: Date | undefined) => {
    fromDateRef.current = newDate
    setFromDate(newDate)
  }, [])

  const updateToDate = React.useCallback((newDate: Date | undefined) => {
    toDateRef.current = newDate
    setToDate(newDate)
  }, [])

  // Initialize flatpickr instances
  React.useEffect(() => {
    if (!fromInputRef.current || !toInputRef.current) return

    const locale = getFlatpickrLocale(currentLocale)

    // From Date Picker
    fromPickerRef.current = flatpickr(fromInputRef.current, {
      dateFormat: 'd.m.Y',
      locale,
      defaultDate: fromDate,
      onChange: (selectedDates) => {
        const newFromDate = selectedDates[0]
        updateFromDate(newFromDate)

        // Update To picker's minDate to prevent invalid ranges
        if (toPickerRef.current && newFromDate) {
          toPickerRef.current.set('minDate', newFromDate)
        }

        // Call onChange with updated range
        onDateChange?.({
          from: newFromDate || undefined,
          to: toDateRef.current
        })
      }
    })

    // To Date Picker
    toPickerRef.current = flatpickr(toInputRef.current, {
      dateFormat: 'd.m.Y',
      locale,
      defaultDate: toDate,
      minDate: fromDate, // Set initial minDate
      onChange: (selectedDates) => {
        const newToDate = selectedDates[0]
        updateToDate(newToDate)

        // Call onChange with updated range
        onDateChange?.({
          from: fromDateRef.current,
          to: newToDate || undefined
        })
      }
    })

    // Cleanup on unmount
    return () => {
      fromPickerRef.current?.destroy()
      toPickerRef.current?.destroy()
    }
  }, []) // Only run on mount

  // Update flatpickr when external date prop changes
  React.useEffect(() => {
    if (date?.from !== fromDate) {
      updateFromDate(date?.from)
      fromPickerRef.current?.setDate(date?.from || '', false)
    }
    if (date?.to !== toDate) {
      updateToDate(date?.to)
      toPickerRef.current?.setDate(date?.to || '', false)
    }
  }, [date, fromDate, toDate, updateFromDate, updateToDate])

  // Update locale when it changes
  React.useEffect(() => {
    const locale = getFlatpickrLocale(currentLocale)
    fromPickerRef.current?.set('locale', locale)
    toPickerRef.current?.set('locale', locale)
  }, [currentLocale])

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {/* From Date Picker - Direct input, no wrapper */}
      <input
        ref={fromInputRef}
        type="text"
        placeholder={t('Orders.filters.dateFromPlaceholder')}
        readOnly
        className="w-[130px] h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all text-slate-900 placeholder:text-slate-400 font-normal cursor-pointer"
      />

      {/* Separator - Aligned with inputs now */}
      <div className="text-slate-400">—</div>

      {/* To Date Picker - Direct input, no wrapper */}
      <input
        ref={toInputRef}
        type="text"
        placeholder={t('Orders.filters.dateToPlaceholder')}
        readOnly
        className="w-[130px] h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all text-slate-900 placeholder:text-slate-400 font-normal cursor-pointer"
      />
    </div>
  )
}
