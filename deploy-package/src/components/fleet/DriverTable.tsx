"use client"

import { useState } from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table"
import { format, differenceInDays, parseISO } from "date-fns"
import { Phone, Send, MoreHorizontal, FileText, Settings, ShieldCheck, ShieldAlert } from "lucide-react"
import { formatDate } from "@/lib/date-utils"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Driver {
    id: string
    name: string
    phone: string
    email: string | null
    licenseNumber: string
    licenseExpiry: string | null
    status: string
    vehicle?: {
        plateNumber: string
        model: string
    } | null
    performance?: {
        totalDeliveries: number
        onTimeDeliveries: number
        onTimePercentage: number
    }
}

interface DriverTableProps {
    data: Driver[]
    onEdit: (driver: Driver) => void
}

export function DriverTable({ data, onEdit }: DriverTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])

    const columns: ColumnDef<Driver>[] = [
        {
            accessorKey: "name",
            header: "Driver",
            cell: ({ row }) => {
                const driver = row.original
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-200">
                            <AvatarImage src={`https://avatar.vercel.sh/${driver.name}.png`} />
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                                {driver.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.email || 'No email'}</p>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "phone",
            header: "Contact",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 font-medium font-mono">{row.original.phone}</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-emerald-600">
                                <Phone className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-sky-600">
                                <Send className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "license",
            header: "License Validity",
            cell: ({ row }) => {
                const license = row.original.licenseNumber
                const expiry = row.original.licenseExpiry

                let expiryStatus = 'valid'
                let daysLeft = 0

                if (expiry) {
                    daysLeft = differenceInDays(parseISO(expiry), new Date())
                    if (daysLeft < 0) expiryStatus = 'expired'
                    else if (daysLeft < 30) expiryStatus = 'warning'
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-mono font-medium text-slate-700">{license}</span>
                        {expiry ? (
                            <span className={`text-[10px] font-medium flex items-center gap-1 ${expiryStatus === 'expired' ? 'text-red-600' :
                                    expiryStatus === 'warning' ? 'text-amber-600' : 'text-slate-500'
                                }`}>
                                {expiryStatus === 'warning' && <ShieldAlert className="h-3 w-3" />}
                                {expiryStatus === 'valid' && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                                Expires: {formatDate(expiry)}
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-400">No Expiry Date</span>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "vehicle",
            header: "Assigned Vehicle",
            cell: ({ row }) => {
                const vehicle = row.original.vehicle
                if (!vehicle) return <span className="text-slate-400 text-xs italic">Unassigned</span>

                return (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-xs hover:bg-slate-200">
                        {vehicle.plateNumber}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "performance",
            header: "Performance",
            cell: ({ row }) => {
                const perf = row.original.performance

                if (!perf || perf.totalDeliveries === 0) {
                    return (
                        <span className="text-xs text-slate-400 italic">No data</span>
                    )
                }

                const pct = perf.onTimePercentage
                const colorClass = pct >= 95 ? 'emerald' : pct >= 85 ? 'amber' : 'red'

                return (
                    <span className={`text-xs font-bold text-${colorClass}-600 bg-${colorClass}-50 px-2 py-0.5 rounded-full border border-${colorClass}-100`}>
                        {pct.toFixed(0)}% On-Time
                    </span>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500' :
                                status === 'ON_LEAVE' ? 'bg-amber-400' :
                                    'bg-slate-300'
                            }`} />
                        <span className="text-sm text-slate-700 capitalize">
                            {status.replace('_', ' ').toLowerCase()}
                        </span>
                    </div>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-slate-200 w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(row.original)} className="gap-2 cursor-pointer">
                                <Settings className="h-4 w-4 text-slate-500" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                                <FileText className="h-4 w-4 text-slate-500" /> View History
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    })

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className="hover:bg-slate-50/50 border-slate-100"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="py-3">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                No drivers found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
