import * as React from "react"
import { cn } from "@/lib/utils"

interface LicensePlateProps {
  plateNumber: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Uzbekistan License Plate Component
 *
 * Formats and displays vehicle plate numbers in authentic Uzbekistan style.
 * Format: "01A234BC" → "01 A 234 BC 🇺🇿"
 *
 * @example
 * <LicensePlate plateNumber="01A234BC" size="sm" />
 */
export function LicensePlate({ plateNumber, size = 'sm', className }: LicensePlateProps) {
  // Parse Uzbekistan plate format: 01298QMA → "01 298 QMA"
  const formatPlateNumber = (plate: string): string => {
    if (!plate || plate.length < 8) return plate

    // Remove any existing spaces
    const clean = plate.replace(/\s/g, '').toUpperCase()

    // Expected format: 01298QMA
    // Extract: region(2) + numbers(3) + letters(3)
    const match = clean.match(/^(\d{2})(\d{3})([A-Z]{3})$/)

    if (match) {
      const [, region, numbers, letters] = match
      return `${region} ${numbers} ${letters}`
    }

    // Fallback: try to add basic spacing if format doesn't match exactly
    if (clean.length === 8) {
      return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`
    }

    return plate
  }

  const formattedPlate = formatPlateNumber(plateNumber)

  // Size variants
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2"
  }

  return (
    <div className="inline-flex items-center gap-1">
      {/* Vehicle Icon */}
      <span className="text-slate-400">🚚</span>

      {/* License Plate */}
      <div
        className={cn(
          // Base plate styling - realistic Uzbekistan license plate
          "inline-flex items-center justify-between",
          "font-mono font-bold tracking-wide",
          "bg-white border-2 border-slate-800",
          "rounded shadow-sm",
          "transition-all duration-200",
          // Subtle hover effect
          "hover:shadow-md hover:scale-105",
          // Size variant
          sizeClasses[size],
          className
        )}
      >
        {/* Plate Number */}
        <span className="text-slate-900 select-all">
          {formattedPlate}
        </span>

        {/* Country Code Flag */}
        <span className="text-[10px] opacity-80 ml-1">
          🇺🇿
        </span>
      </div>
    </div>
  )
}
