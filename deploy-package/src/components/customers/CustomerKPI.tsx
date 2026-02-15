"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Building2, Store, FileCheck } from "lucide-react"

interface CustomerKPIProps {
    totalOrgs: number
    totalBranches: number
    complianceRate: number
}

export function CustomerKPI({ totalOrgs, totalBranches, complianceRate }: CustomerKPIProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Organizations */}
            <Card className="border-slate-100 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Organizations</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-bold text-slate-900">{totalOrgs}</h3>
                            <span className="text-xs text-emerald-600 font-medium whitespace-nowrap bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                Active
                            </span>
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                </CardContent>
            </Card>

            {/* Network Size */}
            <Card className="border-slate-100 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Network Size</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-bold text-slate-900">{totalBranches}</h3>
                            <span className="text-xs text-slate-500 font-normal">Retail Branches</span>
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                        <Store className="h-5 w-5 text-indigo-600" />
                    </div>
                </CardContent>
            </Card>

            {/* Contract Compliance */}
            <Card className="border-slate-100 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contract Compliance</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-bold text-slate-900">{complianceRate}%</h3>
                            <span className="text-xs text-emerald-600 font-medium whitespace-nowrap bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                Good Standing
                            </span>
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                        <FileCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
