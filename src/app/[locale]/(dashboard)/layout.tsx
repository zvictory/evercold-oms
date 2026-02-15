'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  // Check if this is a driver route by looking at the path structure
  // Paths like /ru/driver, /en/driver, /ru/driver/routes, etc.
  const isDriverRoute = pathname?.match(/\/(ru|en|uz-Latn|uz-Cyrl)\/driver/)

  // Driver routes: Clean layout with no sidebar/topbar
  if (isDriverRoute) {
    return <>{children}</>
  }

  // Admin routes: Full dashboard layout
  return (
    <div className="flex h-screen overflow-hidden" suppressHydrationWarning>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
