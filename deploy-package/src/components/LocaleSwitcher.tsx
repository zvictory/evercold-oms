"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useI18n, useCurrentLocale } from '@/locales/client'
import { locales, localeNames, localeFlags, type Locale } from "@/locales/config"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe } from "lucide-react"

export function LocaleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useCurrentLocale()
  const t = useI18n()

  const handleLocaleChange = (newLocale: string) => {
    // Replace the locale in the pathname
    // pathname is like "/ru/orders" or "/uz-Latn/fleet"
    const segments = pathname.split('/')
    // segments[0] is empty, segments[1] is the locale
    segments[1] = newLocale
    const newPath = segments.join('/')

    router.push(newPath)
  }

  return (
    <div className="w-full">
      <Select value={currentLocale} onValueChange={handleLocaleChange}>
        <SelectTrigger className="w-full bg-slate-50 border-slate-200 hover:bg-white transition-colors">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale} value={locale}>
              <div className="flex items-center gap-2">
                <span>{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
