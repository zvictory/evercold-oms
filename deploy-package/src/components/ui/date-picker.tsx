"use client"

import * as React from "react"
import flatpickr from "flatpickr"
import type { Instance } from "flatpickr/dist/types/instance"
import { Calendar } from "lucide-react"
import { useCurrentLocale } from '@/locales/client'
import { getFlatpickrLocale } from '@/lib/flatpickr-locales'
import { cn } from "@/lib/utils"
import "flatpickr/dist/flatpickr.min.css"

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: Date | string | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  enableTime?: boolean
  minDate?: Date | string
  maxDate?: Date | string
}

/**
 * Single Date Picker Component
 *
 * A production-ready date picker using flatpickr with:
 * - Single date selection with optional datetime mode
 * - Multi-language support (4 languages)
 * - Ice & Steel design system styling
 * - Date format: d.m.Y (31.01.2026)
 * - Calendar icon (Lucide React)
 * - Full accessibility support
 *
 * Usage:
 * const [date, setDate] = useState<Date | null>(null)
 * <DatePicker value={date} onChange={setDate} placeholder="Select date" />
 *
 * With datetime:
 * <DatePicker value={date} onChange={setDate} enableTime={true} />
 */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = "Select date",
      className,
      disabled = false,
      enableTime = false,
      minDate,
      maxDate,
      ...inputProps
    },
    ref
  ) => {
    const currentLocale = useCurrentLocale()

    // Refs for input element and flatpickr instance
    const inputRef = React.useRef<HTMLInputElement>(null)
    const pickerRef = React.useRef<Instance | null>(null)

    // Ref to store current date value (solves stale closure bug)
    const dateRef = React.useRef<Date | null>(null)

    // Internal state to track selected date
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

    // Helper function to update both ref and state atomically
    const updateDate = React.useCallback((newDate: Date | null) => {
      dateRef.current = newDate
      setSelectedDate(newDate)
    }, [])

    // Helper to validate and parse initial value
    const parseInitialValue = React.useCallback((val: Date | string | null | undefined): Date | null => {
      if (!val) return null

      if (val instanceof Date) {
        return isValidDate(val) ? val : null
      }

      if (typeof val === 'string') {
        const parsed = new Date(val)
        return isValidDate(parsed) ? parsed : null
      }

      return null
    }, [])

    // Helper to check if date is valid
    const isValidDate = (date: Date): boolean => {
      return date instanceof Date && !isNaN(date.getTime())
    }

    // Initialize flatpickr instance on mount
    React.useEffect(() => {
      if (!inputRef.current) return

      const locale = getFlatpickrLocale(currentLocale)
      const initialDate = parseInitialValue(value)

      pickerRef.current = flatpickr(inputRef.current as any, {
        dateFormat: enableTime ? 'd.m.Y H:i' : 'd.m.Y',
        locale,
        allowInput: true,
        enableTime,
        time_24hr: true,
        minDate: minDate ? parseInitialValue(minDate) || undefined : undefined,
        maxDate: maxDate ? parseInitialValue(maxDate) || undefined : undefined,
        defaultDate: initialDate || undefined,
        onChange: (selectedDates: Date[]) => {
          const newDate = selectedDates[0] || null
          updateDate(newDate)
          onChange?.(newDate)
        }
      } as any)

      // Cleanup on unmount
      return () => {
        pickerRef.current?.destroy()
      }
    }, []) // Only run on mount

    // Update flatpickr when external value prop changes
    React.useEffect(() => {
      const newValue = parseInitialValue(value)

      if (newValue?.getTime() !== selectedDate?.getTime()) {
        updateDate(newValue)
        pickerRef.current?.setDate(newValue || '', false)
      }
    }, [value, selectedDate, updateDate, parseInitialValue])

    // Update locale when it changes
    React.useEffect(() => {
      const locale = getFlatpickrLocale(currentLocale)
      pickerRef.current?.set('locale', locale)
    }, [currentLocale])

    // Update date constraints when they change
    React.useEffect(() => {
      if (pickerRef.current) {
        const parsedMinDate = minDate ? parseInitialValue(minDate) : undefined
        const parsedMaxDate = maxDate ? parseInitialValue(maxDate) : undefined

        pickerRef.current.set('minDate', parsedMinDate || undefined)
        pickerRef.current.set('maxDate', parsedMaxDate || undefined)
      }
    }, [minDate, maxDate, parseInitialValue])

    // Merge refs to allow external ref access
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <div className="relative inline-block">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            // Base styling
            "h-10 px-3 py-2 pr-10 text-sm rounded-md border border-slate-200 bg-white",

            // Text & placeholder
            "text-slate-900 placeholder:text-slate-400",

            // Interactive states
            "hover:bg-slate-50",
            "focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600",

            // Transitions
            "transition-all font-normal",

            // Disabled state
            disabled ? "cursor-not-allowed opacity-50 bg-slate-100" : "cursor-pointer",

            // Custom className override
            className
          )}
          {...inputProps}
        />

        {/* Calendar icon - positioned absolutely */}
        <Calendar
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    )
  }
)

DatePicker.displayName = "DatePicker"
