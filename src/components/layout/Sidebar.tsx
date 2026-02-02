"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n, useCurrentLocale } from '@/locales/client'
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Truck,
    Users,
    Settings,
    Menu,
    ChevronLeft
} from "lucide-react"
import { LocaleSwitcher } from "@/components/LocaleSwitcher"
import { useQuery } from "@tanstack/react-query"
import { UserRole } from "@prisma/client"

interface SidebarProps extends React.HTMLAttributes<HTMLElement> { }

export function Sidebar({ className, ...props }: SidebarProps) {
    const pathname = usePathname()
    const locale = useCurrentLocale()
    const t = useI18n()
    const [collapsed, setCollapsed] = React.useState(false)

    // Fetch current user
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const res = await fetch('/api/auth/me')
            if (!res.ok) return null
            return res.json()
        },
        retry: false
    })

    const navItems = [
        { name: t('Nav.dashboard'), href: `/${locale}`, icon: LayoutDashboard },
        { name: t('Nav.orders'), href: `/${locale}/orders`, icon: ShoppingCart },
        { name: t('Nav.products'), href: `/${locale}/products`, icon: Package },
        { name: t('Nav.fleet'), href: `/${locale}/fleet`, icon: Truck },
        { name: t('Nav.customers'), href: `/${locale}/customers`, icon: Users },
        // Only show Users link to Admins and Managers
        ...(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER ? [{
            name: t('Nav.users'),
            href: `/${locale}/settings/users`,
            icon: Users
        }] : []),
        { name: t('Nav.settings'), href: `/${locale}/settings`, icon: Settings },
    ]

    return (
        <aside
            className={cn(
                "bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-300 flex flex-col z-30",
                collapsed ? "w-20" : "w-64",
                className
            )}
            {...props}
        >
            {/* Header / Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                <div className={cn("flex items-center gap-2 overflow-hidden", collapsed && "justify-center w-full")}>
                    <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-lg">E</span>
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-slate-800 text-lg whitespace-nowrap">
                            EverCold <span className="text-sky-500">CRM</span>
                        </span>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative group",
                                isActive
                                    ? "bg-sky-50 text-sky-700 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sky-600" : "text-slate-500 group-hover:text-slate-700")} />
                            {!collapsed && <span>{item.name}</span>}

                            {/* Active Indicator Line for Collapsed State */}
                            {collapsed && isActive && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-sky-500 rounded-r-full" />
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Locale Switcher */}
            {!collapsed && (
                <div className="px-3 pb-3">
                    <LocaleSwitcher />
                </div>
            )}

            {/* Footer / User / Collapse Toggle (Mobile) */}
            <div className="p-4 border-t border-slate-100">
                {collapsed ? (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="w-full h-10 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                            <span className="text-xs font-semibold text-slate-600">JD</span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-slate-900 truncate">John Doe</span>
                            <span className="text-xs text-slate-500 truncate">Manager</span>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}
