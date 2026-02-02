"use client"

import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    MoreHorizontal,
    Truck,
    FileText,
    Trash2,
    Download,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/date-utils"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InvoiceGeneratorModal } from "./InvoiceGeneratorModal"

export function OrderTable({
    orders: initialOrders,
    loading,
    error,
    onEdit,
    selection,
    onSelectionChange
}: {
    orders: any[]
    loading: boolean
    error: string | null
    onEdit: (order: any) => void
    selection: string[]
    onSelectionChange: (ids: string[]) => void
}) {
    // Fallback translations
    const t = (path: string): string => {
        const translations: Record<string, string> = {
            // Status labels
            "Orders.status.new": "Новый",
            "Orders.status.confirmed": "Подтверждён",
            "Orders.status.shipped": "Отгружен",
            "Orders.status.delivered": "Доставлен",
            "Orders.status.cancelled": "Отменён",
            // Loading and error states
            "Orders.loading": "Загрузка заказов...",
            "Orders.errorTitle": "Не удалось загрузить заказы",
            "Orders.emptyTitle": "Заказы не найдены",
            "Orders.emptySubtitle": "Попробуйте изменить фильтры или создайте новый заказ",
            // Table headers
            "Orders.tableHeaders.id": "Номер",
            "Orders.tableHeaders.branch": "Филиал",
            "Orders.tableHeaders.date": "Дата",
            "Orders.tableHeaders.volume": "Объём",
            "Orders.tableHeaders.value": "Сумма",
            "Orders.tableHeaders.status": "Статус",
            // Actions
            "actionsMenu": "Действия",
            "editDetails": "Редактировать",
            "downloadInvoice": "Скачать счёт",
            "downloading": "Скачивание...",
            "deleteOrder": "Удалить заказ",
        }
        return translations[path] || path
    }

    // For backward compatibility with tOrders references
    const tOrders = t
    const [orders, setOrders] = React.useState(initialOrders)
    const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false)
    const [downloadingId, setDownloadingId] = React.useState<string | null>(null)

    // Update local state when prop changes
    React.useEffect(() => {
        setOrders(initialOrders)
    }, [initialOrders])

    // Selection Handlers
    const toggleRow = (id: string) => {
        onSelectionChange(
            selection.includes(id) ? selection.filter(r => r !== id) : [...selection, id]
        )
    }

    const toggleAll = () => {
        if (selection.length === orders.length) {
            onSelectionChange([])
        } else {
            onSelectionChange(orders.map(o => o.id))
        }
    }

    // Optimistic Delete
    const handleDelete = (id: string) => {
        const previousOrders = [...orders]
        setOrders(orders.filter(o => o.id !== id))
        // In real app, call deleteOrder(id) and handle error by reverting state if needed
    }

    // Status Update logic
    const updateStatus = (id: string, newStatus: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    }

    const handleDownloadInvoice = async (orderId: string) => {
        try {
            setDownloadingId(orderId)

            const response = await fetch(`/api/orders/${orderId}/schet-faktura`)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to generate invoice')
            }

            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition')
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                : `schet-faktura-${orderId}.xlsx`

            // Download file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

        } catch (error: any) {
            console.error('Invoice download error:', error)
            alert(`Failed to download invoice: ${error.message}`)
        } finally {
            setDownloadingId(null)
        }
    }

    // Status Badge Helper with Dropdown
    const StatusBadge = ({ id, status }: { id: string, status: string }) => {
        const variants: Record<string, { label: string, color: string, dot: string }> = {
            "NEW": { label: t('Orders.status.new'), color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
            "CONFIRMED": { label: t('Orders.status.confirmed'), color: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-500" },
            "SHIPPED": { label: t('Orders.status.shipped'), color: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-500" },
            "DELIVERED": { label: t('Orders.status.delivered'), color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
            "CANCELLED": { label: t('Orders.status.cancelled'), color: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
        }

        const current = variants[status] || { label: status, color: "bg-slate-50 text-slate-700 border-slate-100", dot: "bg-slate-400" }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn("cursor-pointer capitalize font-medium py-0.5 px-2 gap-1.5 transition-all hover:ring-2 hover:ring-offset-1 ring-sky-100", current.color)}
                    >
                        <div className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
                        {current.label}
                    </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-32">
                    {Object.entries(variants).map(([s, data]) => (
                        <DropdownMenuItem
                            key={s}
                            onClick={() => updateStatus(id, s)}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <div className={cn("h-1.5 w-1.5 rounded-full", data.dot)} />
                            {data.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    // Loading state
    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-sky-600 mx-auto mb-4"></div>
                        <p className="text-sm text-slate-500">{t('Orders.loading')}</p>
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('Orders.errorTitle')}</h3>
                        <p className="text-sm text-slate-500">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    // Empty state
    if (orders.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('Orders.emptyTitle')}</h3>
                        <p className="text-sm text-slate-500">{t('Orders.emptySubtitle')}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-200">
                        <TableHead className="w-[48px] px-4">
                            <Checkbox
                                checked={orders.length > 0 && selection.length === orders.length}
                                onCheckedChange={toggleAll}
                            />
                        </TableHead>
                        <TableHead className="w-[100px] font-semibold text-slate-900">{t('Orders.tableHeaders.id')}</TableHead>
                        <TableHead className="font-semibold text-slate-900">{t('Orders.tableHeaders.branch')}</TableHead>
                        <TableHead className="font-semibold text-slate-900">{t('Orders.tableHeaders.date')}</TableHead>
                        <TableHead className="text-right font-semibold text-slate-900">{t('Orders.tableHeaders.volume')}</TableHead>
                        <TableHead className="text-right font-semibold text-slate-900">{t('Orders.tableHeaders.value')}</TableHead>
                        <TableHead className="w-[140px] text-center font-semibold text-slate-900">{t('Orders.tableHeaders.status')}</TableHead>
                        <TableHead className="w-[80px] text-right px-4"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow
                            key={order.id}
                            className={cn(
                                "group border-slate-100 transition-colors",
                                selection.includes(order.id) ? "bg-sky-50/30" : "hover:bg-slate-50/50"
                            )}
                        >
                            <TableCell className="px-4">
                                <Checkbox
                                    checked={selection.includes(order.id)}
                                    onCheckedChange={() => toggleRow(order.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <button
                                    onClick={() => onEdit(order)}
                                    className="font-mono font-bold text-sky-600 hover:text-sky-700 hover:underline text-sm"
                                >
                                    {order.orderNumber}
                                </button>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">{order.branch}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {order.branchCode}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-slate-500 tabular-nums text-sm">
                                {formatDate(order.date)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                    {order.products?.ice3kg > 0 && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-[11px] font-bold gap-1">
                                            <span className="text-blue-500">3kg</span>
                                            <span className="text-blue-700">×{order.products.ice3kg}</span>
                                        </Badge>
                                    )}
                                    {order.products?.ice1kg > 0 && (
                                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 px-2 py-0.5 text-[11px] font-bold gap-1">
                                            <span className="text-sky-500">1kg</span>
                                            <span className="text-sky-700">×{order.products.ice1kg}</span>
                                        </Badge>
                                    )}
                                    {!order.products?.ice3kg && !order.products?.ice1kg && (
                                        <span className="tabular-nums text-slate-600">
                                            {order.weight.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-0.5">KG</span>
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium text-slate-900">
                                {order.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-0.5">UZS</span>
                            </TableCell>
                            <TableCell className="text-center">
                                <StatusBadge id={order.id} status={order.status} />
                            </TableCell>
                            <TableCell className="text-right px-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>{tOrders("actionsMenu")}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onEdit(order)} className="cursor-pointer">
                                            <FileText className="h-4 w-4 mr-2 text-slate-400" /> {tOrders("editDetails")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDownloadInvoice(order.id)}
                                            disabled={downloadingId === order.id}
                                            className="cursor-pointer"
                                        >
                                            <Download className="h-4 w-4 mr-2 text-slate-400" />
                                            {downloadingId === order.id ? tOrders("downloading") : tOrders("downloadInvoice")}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(order.id)}
                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> {tOrders("deleteOrder")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <InvoiceGeneratorModal
                open={isInvoiceOpen}
                onOpenChange={setIsInvoiceOpen}
                selectedOrders={orders.filter(o => selection.includes(o.id))}
            />
        </div>
    )
}
