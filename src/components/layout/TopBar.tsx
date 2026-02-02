"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCurrentLocale } from "@/locales/client"
import { Search, Bell, User as UserIcon, LogOut, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, fetchWithAuth } from "@/lib/utils"

export function TopBar() {
  const router = useRouter()
  const locale = useCurrentLocale()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Clear localStorage and cookie
        localStorage.removeItem('userInfo');
        localStorage.removeItem('authToken');
        document.cookie = 'authToken=; path=/; max-age=0';

        // Redirect to login
        router.push(`/${locale}/login`);
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 glass px-6 h-16 flex items-center justify-between">
      {/* Left: Global Search (Command+K style) */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
          <input
            type="text"
            placeholder="Search orders, customers, fleet..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-slate-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-4 ml-4">
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-sky-600 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-sky-500 rounded-full border border-white"></span>
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2 pl-2 pr-3 rounded-full hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="h-8 w-8 bg-sky-100 rounded-full flex items-center justify-center border border-sky-200 text-sky-700">
              <UserIcon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden md:inline-block">Profile</span>
          </Button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <Link
                href={`/${locale}/change-password`}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Lock className="h-4 w-4" />
                Change Password
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}

          {/* Close menu when clicking outside */}
          {menuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  )
}
