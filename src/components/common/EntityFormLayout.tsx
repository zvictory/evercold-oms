"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EntityFormLayoutProps {
    title: string
    subtitle?: string
    backHref?: string
    actions?: React.ReactNode
    children: React.ReactNode
}

export function EntityFormLayout({
    title,
    subtitle,
    backHref,
    actions,
    children
}: EntityFormLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {backHref && (
                            <Link href={backHref} className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-slate-100">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
                            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
                        </div>
                    </div>

                    {actions && (
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-6 py-8">
                {children}
            </div>
        </div>
    )
}
