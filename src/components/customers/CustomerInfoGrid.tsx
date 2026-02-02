"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    FileText,
    CreditCard,
    User,
    Phone,
    Mail,
    Send,
    MapPin,
    Clock,
    Wallet,
    Store
} from "lucide-react"

interface CustomerInfoGridProps {
    contractNumber: string | null
    taxId: string | null // INN
    hasVat: boolean
    bankAccount?: string | null
    mfo?: string | null
    contactPerson: string | null
    contactPhone: string | null
    contactEmail: string | null
    telegramUsername?: string | null
    totalBranches: number
    lastOrderDate?: string
}

export function CustomerInfoGrid({
    contractNumber,
    taxId,
    hasVat,
    bankAccount,
    mfo,
    contactPerson,
    contactPhone,
    contactEmail,
    telegramUsername,
    totalBranches,
    lastOrderDate
}: CustomerInfoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
            {/* 1. Contract & Legal */}
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-500" />
                        Contract & Legal
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Active Contract</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900">{contractNumber || "No Active Contract"}</span>
                            {contractNumber && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Valid</span>}
                        </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">INN (Tax ID)</p>
                            <span className="text-sm font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 block w-fit">
                                {taxId || "—"}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">VAT Status</p>
                            {hasVat ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                    Registered
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                                    Not Registered
                                </span>
                            )}
                        </div>
                    </div>

                    {(bankAccount || mfo) && (
                        <>
                            <Separator className="bg-slate-100" />
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" /> Banking
                                </p>
                                <div className="space-y-1">
                                    <div className="text-xs">
                                        <span className="text-slate-400 mr-2">ACC:</span>
                                        <span className="font-mono text-slate-600">{bankAccount || "—"}</span>
                                    </div>
                                    <div className="text-xs">
                                        <span className="text-slate-400 mr-2">MFO:</span>
                                        <span className="font-mono text-slate-600">{mfo || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 2. Primary Contact */}
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-500" />
                        Primary Contact
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div>
                        <p className="text-sm font-bold text-slate-900">{contactPerson || "Not Assigned"}</p>
                        <p className="text-xs text-slate-500">Account Manager / Admin</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Mobile Phone</p>
                                <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
                                    {contactPhone || "—"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                            <div className="h-8 w-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-slate-500">Email Address</p>
                                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                                    {contactEmail || "—"}
                                </p>
                            </div>
                        </div>

                        {telegramUsername && (
                            <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <Send className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Telegram</p>
                                    <p className="text-sm font-medium text-blue-600 group-hover:underline">
                                        @{telegramUsername}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 3. Logistics Summary */}
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <Store className="h-4 w-4 text-amber-500" />
                        Logistics Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
                            <h4 className="text-2xl font-bold text-amber-700">{totalBranches}</h4>
                            <p className="text-xs font-medium text-amber-600/80 uppercase tracking-wider">Active Branches</p>
                        </div>
                        <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                            <h4 className="text-2xl font-bold text-slate-700">Daily</h4>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Delivery Freq.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span>Last Order</span>
                            </div>
                            <span className="font-medium text-slate-900">{lastOrderDate || "Never"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span>Primary Region</span>
                            </div>
                            <span className="font-medium text-slate-900">Tashkent City</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Wallet className="h-4 w-4 text-slate-400" />
                                <span>Payment Terms</span>
                            </div>
                            <span className="font-medium text-slate-900">Standard (Net 30)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
