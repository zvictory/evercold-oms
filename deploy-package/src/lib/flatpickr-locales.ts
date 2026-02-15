import { Russian } from 'flatpickr/dist/l10n/ru.js'
import { english } from 'flatpickr/dist/l10n/default'
import { Uzbek } from 'flatpickr/dist/l10n/uz.js'
import { UzbekLatin } from 'flatpickr/dist/l10n/uz_latn.js'
import type { CustomLocale } from 'flatpickr/dist/types/locale'

/**
 * Map next-international locale codes to flatpickr locale objects
 *
 * Supports all 4 languages used in Evercold CRM:
 * - Russian (ru) - default language
 * - English (en)
 * - Uzbek Latin (uz-Latn)
 * - Uzbek Cyrillic (uz-Cyrl)
 */
export function getFlatpickrLocale(locale: string): CustomLocale {
  switch (locale) {
    case 'ru':
      return Russian
    case 'en':
      return english
    case 'uz-Latn':
      return UzbekLatin
    case 'uz-Cyrl':
      return Uzbek
    default:
      // Default to Russian as per CLAUDE.md
      return Russian
  }
}
