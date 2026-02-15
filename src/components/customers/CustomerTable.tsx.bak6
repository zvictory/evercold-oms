"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Building2,
    MoreHorizontal,
    Store,
    FileText,
    ArrowUpDown,
    Phone,
    Search
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import Link from 'next/link'
import { useI18n, useCurrentLocale } from '@/locales/client'

// Define the Customer type based on our needs
export interface Customer {
    id: string
    name: string
    customerCode: string | null
    taxId?: string // Optional for now
    contractNumber?: string
    contractStartDate?: string
    contactPerson?: string
    contactPhone: string | null
    status: "active" | "inactive" // Derived field
    totalBranches: number // Calculated field
}

// Helper function to create columns with translations
export const createColumns = (t: any, locale: string): ColumnDef<Customer>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="pl-0 hover:bg-transparent font-semibold text-slate-700 uppercase text-xs tracking-wide"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t('Customers.tableHeaders.organization')}
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const customer = row.original
            return (
                <div className="flex items-center gap-3 py-1">
                    <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarImage src={`https://avatar.vercel.sh/${customer.name}.png`} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                            {customer.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 leading-none">{customer.name}</span>
                        {customer.taxId && (
                            <span className="text-xs text-slate-500 mt-1">INN: {customer.taxId}</span>
                        )}
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "customerCode",
        header: ({ column }) => (
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('Customers.tableHeaders.code')}</div>
        ),
        cell: ({ row }) => {
            const code = row.getValue("customerCode") as string
            return code ? (
                <Badge variant="outline" className="font-mono text-xs bg-slate-50 text-slate-600 border-slate-200">
                    {code}
                </Badge>
            ) : <span className="text-slate-300 text-xs">—</span>
        },
    },
    {
        id: "contract",
        header: ({ column }) => (
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('Customers.tableHeaders.contract')}</div>
        ),
        cell: ({ row }) => {
            const customer = row.original
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <FileText className="h-3 w-3 text-sky-500" />
                        {customer.contractNumber || t('Customers.contract.noContract')}
                    </div>
                    {customer.contractStartDate && (
                        <span className="text-[10px] text-slate-400 pl-4.5">{t('Customers.contract.since')} {customer.contractStartDate}</span>
                    )}
                </div>
            )
        }
    },
    {
        accessorKey: "totalBranches",
        header: ({ column }) => (
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('Customers.tableHeaders.network')}</div>
        ),
        cell: ({ row }) => {
            const count = row.getValue("totalBranches") as number
            return (
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 cursor-pointer">
                    <Store className="mr-1 h-3 w-3" />
                    {count} {t('Customers.network.branches')}
                </Badge>
            )
        }
    },
    {
        accessorKey: "contactPerson",
        header: ({ column }) => (
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('Customers.tableHeaders.primaryContact')}</div>
        ),
        cell: ({ row }) => {
            const customer = row.original
            return (
                <div className="flex flex-col">
                    <span className="text-sm text-slate-700 font-medium">{customer.contactPerson || t('Customers.contact.notAvailable')}</span>
                    {customer.contactPhone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {customer.contactPhone}
                        </div>
                    )}
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('Customers.tableHeaders.status')}</div>
        ),
        cell: ({ row }) => {
            // Mock status logic for now
            const status = row.original.status || "active";
            const isActive = status === "active";

            return (
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <span className={`text-xs font-medium ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {isActive ? t('Customers.status.active') : t('Customers.status.inactive')}
                    </span>
                </div>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const customer = row.original

            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Link href={`/${locale}/customers/${customer.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                    View Details
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>Edit Contract</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Manage Branches</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]

interface CustomerTableProps {
    data: Customer[]
}

export function CustomerTable({ data }: CustomerTableProps) {
    const t = useI18n()
    const locale = useCurrentLocale()
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = React.useState({})

    const columns = React.useMemo(() => createColumns(t, locale), [t, locale])

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search customers, INN, or contract..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden h-8 lg:flex text-slate-600 border-slate-200">
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="hidden h-8 lg:flex text-slate-600 border-slate-200">
                        Export
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-100">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-10 text-slate-600">
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
                                    className="hover:bg-slate-50/80 border-slate-100 group cursor-pointer"
                                    onClick={() => window.location.href = `/${locale}/customers/${row.original.id}`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-slate-500"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t border-slate-100 bg-slate-50/30">
                <div className="flex-1 text-sm text-slate-500">
                    Showing {table.getFilteredRowModel().rows.length} customers
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 w-8 p-0"
                    >
                        {'<'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 w-8 p-0"
                    >
                        {'>'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
