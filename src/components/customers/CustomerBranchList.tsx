"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Eye } from "lucide-react"

interface Branch {
    id: string
    branchCode: string
    fullName: string // Or branchName
    address: string | null
    city: string | null
    region: string | null
    contactPerson: string | null
    contactPhone: string | null
    latitude: number | null
    longitude: number | null
}

interface CustomerBranchListProps {
    branches: Branch[]
    onViewBranch: (id: string) => void
}

export function CustomerBranchList({ branches, onViewBranch }: CustomerBranchListProps) {
    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Branch Network</h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                    {branches.length} Locations
                </span>
            </div>
            <div className="relative overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="w-[100px] text-xs font-semibold text-slate-500 uppercase">Code</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Branch Name</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Region / City</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Address</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Contact</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    No branches found for this customer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            branches.map((branch) => (
                                <TableRow key={branch.id} className="group border-slate-100 hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-medium">
                                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                                            {branch.branchCode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">{branch.fullName}</TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {branch.city || branch.region || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-start gap-1.5 max-w-[250px]">
                                            {branch.latitude && branch.longitude ? (
                                                <MapPin className="h-3.5 w-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <MapPin className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                                            )}
                                            <span className="text-sm text-slate-600 truncate">{branch.address || "No address provided"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">{branch.contactPerson || "—"}</span>
                                            {branch.contactPhone && (
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                    <Phone className="h-3 w-3" />
                                                    {branch.contactPhone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewBranch(branch.id)}
                                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
