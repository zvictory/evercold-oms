"use client"

import Link from 'next/link'
import { ArrowLeft, Building2, Store, Edit, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CustomerDetailHeaderProps {
    customerName: string
    customerCode: string | null
    onEdit: () => void
    onAddBranch: () => void
}

export function CustomerDetailHeader({
    customerName,
    customerCode,
    onEdit,
    onAddBranch
}: CustomerDetailHeaderProps) {
    return (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <Avatar className="h-12 w-12 border border-slate-200 shadow-sm">
                    <AvatarImage src={`https://avatar.vercel.sh/${customerName}.png`} />
                    <AvatarFallback className="bg-sky-100 text-sky-700 text-lg font-bold">
                        {customerName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{customerName}</h1>
                        {customerCode && (
                            <Badge variant="outline" className="font-mono bg-slate-50 text-slate-600 border-slate-200">
                                {customerCode}
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        Corporate Account
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onEdit} className="gap-2 text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-sm">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                </Button>
                <Button onClick={onAddBranch} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-sm">
                    <Store className="h-4 w-4" />
                    Add New Branch
                </Button>
            </div>
        </div>
    )
}
