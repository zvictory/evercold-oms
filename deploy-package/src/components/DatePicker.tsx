'use client'

import { useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import 'flatpickr/dist/flatpickr.min.css'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  enableTime?: boolean
  dateFormat?: string
  placeholder?: string
  className?: string
  id?: string
  minDate?: string
  maxDate?: string
  disabled?: boolean
  clearable?: boolean
  defaultHour?: number
  defaultMinute?: number
}

export default function DatePicker({
  value,
  onChange,
  enableTime = false,
  dateFormat,
  placeholder = 'Выберите дату',
  className = '',
  id,
  minDate,
  maxDate,
  disabled = false,
  clearable = false,
  defaultHour,
  defaultMinute,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const flatpickrRef = useRef<flatpickr.Instance | null>(null)

  useEffect(() => {
    if (!inputRef.current) return

    // Determine format based on enableTime (d.m.Y = dd.mm.yyyy European format)
    const format = dateFormat || (enableTime ? 'd.m.Y H:i' : 'd.m.Y')

    flatpickrRef.current = flatpickr(inputRef.current, {
      enableTime,
      dateFormat: format,
      time_24hr: true,
      defaultDate: value || undefined,
      minDate: minDate || undefined,
      maxDate: maxDate || undefined,
      defaultHour: defaultHour !== undefined ? defaultHour : (enableTime ? 0 : undefined),
      defaultMinute: defaultMinute !== undefined ? defaultMinute : (enableTime ? 0 : undefined),
      locale: Russian,
      onChange: (selectedDates, dateStr) => {
        onChange(dateStr)
      },
      onClose: (selectedDates, dateStr) => {
        // Ensure onChange is called even on close
        if (dateStr !== value) {
          onChange(dateStr)
        }
      },
    })

    return () => {
      if (flatpickrRef.current) {
        flatpickrRef.current.destroy()
      }
    }
  }, [enableTime, dateFormat, minDate, maxDate, defaultHour, defaultMinute])

  // Update value when prop changes
  useEffect(() => {
    if (flatpickrRef.current && value !== flatpickrRef.current.input.value) {
      flatpickrRef.current.setDate(value || '', false)
    }
  }, [value])

  const handleClear = () => {
    if (flatpickrRef.current) {
      flatpickrRef.current.clear()
      onChange('')
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        readOnly
      />
      {clearable && value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Очистить"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
