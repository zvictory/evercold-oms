"use client"

import * as React from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Package,
    Plus,
    Trash2,
    ShoppingCart,
    Search,
    MapPin,
    Copy,
    Calculator,
    Check,
    Phone,
    Clock,
    User
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn, fetchWithAuth } from "@/lib/utils"
import { useScopedI18n } from "@/locales/client"

const orderSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    branchId: z.string().min(1, "Branch is required"),
    orderDate: z.string().min(1, "Date is required"),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1, "Product is required"),
        productName: z.string().optional(),
        quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
        price: z.number(),
        vatRate: z.number(),
        sapCode: z.string().optional(),
        barcode: z.string().optional(),
        hasCustomPrice: z.boolean(),
    })).min(1, "At least one item is required"),
})

type OrderFormValues = z.infer<typeof orderSchema>

interface Customer {
    id: string
    name: string
    customerCode?: string | null
    branches: Branch[]
}

interface Branch {
    id: string
    branchName: string
    branchCode: string
    customerId: string
    deliveryAddress?: string | null
    contactPerson?: string | null
    phone?: string | null
    operatingHours?: string | null
}

interface Product {
    id: string
    name: string
    sapCode?: string | null
    barcode?: string | null
    unitPrice: number
    vatRate: number
    currentPrice: number
    priceWithVat: number
    hasCustomerPrice: boolean
}

interface OrderSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: any
    onSave: (data: any) => Promise<void>
}

export function OrderSheet({ open, onOpenChange, initialData, onSave }: OrderSheetProps) {
    const t = useScopedI18n("Orders.sheet")
    const [branchSearchOpen, setBranchSearchOpen] = React.useState(false)
    const [isCloning, setIsCloning] = React.useState(false)
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [branches, setBranches] = React.useState<Branch[]>([])
    const [products, setProducts] = React.useState<Product[]>([])
    const [loadingProducts, setLoadingProducts] = React.useState(false)
    const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(null)

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: initialData || {
            customerId: "",
            branchId: "",
            orderDate: new Date().toISOString().split('T')[0],
            items: [{ productId: "", productName: "", quantity: 1, price: 0, vatRate: 12, hasCustomPrice: false, sapCode: "", barcode: "" }],
            notes: "",
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    // Watch items and customerId for calculations and data fetching
    const watchedItems = useWatch({
        control: form.control,
        name: "items",
    })

    const customerId = useWatch({
        control: form.control,
        name: "customerId",
    })

    const branchId = form.watch('branchId')

    // Watch branchId and update selectedBranch
    React.useEffect(() => {
        if (branchId && branches.length > 0) {
            const branch = branches.find(b => b.id === branchId)
            setSelectedBranch(branch || null)
        } else {
            setSelectedBranch(null)
        }
    }, [branchId, branches])

    // Calculate totals with proper VAT handling
    const subtotal = watchedItems?.reduce((acc, item) => acc + (item.quantity * item.price || 0), 0) || 0
    const totalVatAmount = watchedItems?.reduce((acc, item) => {
        const itemSubtotal = (item.quantity || 0) * (item.price || 0)
        const itemVat = itemSubtotal * ((item.vatRate || 12) / 100)
        return acc + itemVat
    }, 0) || 0
    const totalAmount = subtotal + totalVatAmount

    // Calculate weighted average VAT rate for display
    const avgVatRate = subtotal > 0
        ? ((totalVatAmount / subtotal) * 100).toFixed(1)
        : '12.0'

    // Fetch customers on mount
    React.useEffect(() => {
        async function fetchCustomers() {
            try {
                const res = await fetchWithAuth('/api/customers', {
                })
                if (!res.ok) throw new Error('Failed to fetch customers')
                const data = await res.json()
                setCustomers(data)
            } catch (error) {
                console.error('Error fetching customers:', error)
            }
        }
        fetchCustomers()
    }, [])

    // Fetch branches and products when customer changes
    React.useEffect(() => {
        if (customerId) {
            const customer = customers.find(c => c.id === customerId)
            if (customer) {
                setBranches(customer.branches || [])
            }

            // Fetch products with customer-specific pricing
            async function fetchProducts() {
                try {
                    setLoadingProducts(true)
                    const res = await fetchWithAuth(`/api/products?customerId=${customerId}`, {
                    })
                    if (!res.ok) throw new Error('Failed to fetch products')
                    const data = await res.json()
                    setProducts(data)
                } catch (error) {
                    console.error('Error fetching products:', error)
                } finally {
                    setLoadingProducts(false)
                }
            }
            fetchProducts()
        } else {
            setBranches([])
            setProducts([])
        }
    }, [customerId, customers])

    // Update form if initialData changes
    React.useEffect(() => {
        if (initialData && open) {
            form.reset({
                ...initialData,
                items: initialData.items || [{ productId: "", productName: "", quantity: 1, price: 0, vatRate: 12, hasCustomPrice: false, sapCode: "", barcode: "" }]
            })
        }
    }, [initialData, form, open])

    const onSubmit = async (data: OrderFormValues) => {
        // Total Quantity Validation
        const totalQty = data.items.reduce((acc, item) => acc + item.quantity, 0)
        if (totalQty <= 0) {
            alert("Total quantity must be greater than zero.")
            return
        }

        await onSave(data)
        form.reset()
    }

    const handleCloneLastOrder = () => {
        setIsCloning(true)
        // Mocking finding last order - this would fetch from API in production
        setTimeout(() => {
            if (products.length >= 2) {
                form.setValue("items", [
                    {
                        productId: products[0].id,
                        productName: products[0].name,
                        quantity: 10,
                        price: products[0].currentPrice,
                        vatRate: products[0].vatRate,
                        hasCustomPrice: products[0].hasCustomerPrice,
                        sapCode: products[0].sapCode || '',
                        barcode: products[0].barcode || ''
                    },
                    {
                        productId: products[1].id,
                        productName: products[1].name,
                        quantity: 5,
                        price: products[1].currentPrice,
                        vatRate: products[1].vatRate,
                        hasCustomPrice: products[1].hasCustomerPrice,
                        sapCode: products[1].sapCode || '',
                        barcode: products[1].barcode || ''
                    },
                ])
            }
            setIsCloning(false)
        }, 600)
    }

    // Header helpers
    const isEdit = !!initialData
    const orderNumber = initialData?.orderNumber || initialData?.id

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[70vw] flex flex-col p-0 h-full border-l border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-white shrink-0">
                    <SheetHeader>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 shadow-sm shadow-sky-50">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                                <Badge variant="outline" className="text-sky-700 bg-sky-50 border-sky-100 py-1">
                                    {isEdit ? t("directEditBadge") : t("manualEntryBadge")}
                                </Badge>
                            </div>
                            {isEdit && initialData.status && (
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none py-1 px-3">
                                    {initialData.status}
                                </Badge>
                            )}
                        </div>
                        <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                            {isEdit ? `${t("editTitle")} ${orderNumber}` : t("newTitle")}
                        </SheetTitle>
                    </SheetHeader>
                </div>

                <ScrollArea className="flex-1 bg-slate-50/30 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
                            {/* Logistics Section */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <MapPin className="h-4 w-4 text-sky-500" />
                                    {t("logisticsSection")}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="customerId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-500 text-xs">{t("customerLabel")}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 bg-slate-50/50 border-slate-200 hover:bg-white transition-colors text-sm">
                                                            <SelectValue placeholder={t("customerPlaceholder")} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {customers.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="branchId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-slate-500 text-xs mb-1">{t("branchLabel")}</FormLabel>
                                                <Popover open={branchSearchOpen} onOpenChange={setBranchSearchOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "h-9 justify-between bg-slate-50/50 border-slate-200 hover:bg-white font-normal text-sm",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? branches.find((b) => b.id === field.value)?.branchName
                                                                    : t("branchPlaceholder")}
                                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder={t("branchSearchPlaceholder")} />
                                                            <CommandList>
                                                                <CommandEmpty>{t("branchNotFound")}</CommandEmpty>
                                                                <CommandGroup>
                                                                    {branches.map((br) => (
                                                                        <CommandItem
                                                                            key={br.id}
                                                                            value={br.branchName}
                                                                            onSelect={() => {
                                                                                form.setValue("branchId", br.id)
                                                                                setBranchSearchOpen(false)
                                                                            }}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <div className="flex items-center">
                                                                                    <Check className={cn("mr-2 h-4 w-4 text-sky-600", field.value === br.id ? "opacity-100" : "opacity-0")} />
                                                                                    <span className="font-medium text-slate-900">{br.branchName}</span>
                                                                                </div>
                                                                                <span className="ml-6 text-[10px] font-bold text-slate-400 font-mono tracking-widest">{br.branchCode}</span>
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="orderDate"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-slate-500 text-xs">{t("deliveryDateLabel")}</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="h-9 bg-slate-50/50 border-slate-200 hover:bg-white transition-colors text-sm" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Branch Logistics Information */}
                                {selectedBranch && (
                                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            {t("deliveryInformationLabel")}
                                        </div>
                                        <div className="space-y-1.5">
                                            {selectedBranch.deliveryAddress && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                    <div className="text-sm text-slate-700">
                                                        {selectedBranch.deliveryAddress}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedBranch.contactPerson && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <div className="text-sm text-slate-700">
                                                        {selectedBranch.contactPerson}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedBranch.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <div className="text-sm font-mono text-slate-700">
                                                        {selectedBranch.phone}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedBranch.operatingHours && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <div className="text-sm text-slate-700">
                                                        {selectedBranch.operatingHours}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Product Line Items */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Package className="h-4 w-4 text-sky-500" />
                                        {t("lineItemsSection")}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-500 hover:text-sky-600 h-8 gap-1.5"
                                            onClick={handleCloneLastOrder}
                                            disabled={isCloning}
                                        >
                                            <Copy className={cn("h-3.5 w-3.5", isCloning && "animate-spin")} />
                                            {isCloning ? t("cloningText") : t("cloneLastOrderButton")}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="bg-white text-sky-600 border-sky-100 hover:bg-sky-50 hover:text-sky-700 h-8 gap-1.5"
                                            onClick={() => append({ productId: "", productName: "", quantity: 1, price: 0, vatRate: 12, hasCustomPrice: false, sapCode: '', barcode: '' })}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {t("addItemButton")}
                                        </Button>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                                    <table className="w-full text-sm table-fixed min-w-[1000px]">
                                        <thead className="bg-slate-50/80 border-b border-slate-200">
                                            <tr>
                                                <th className="text-left py-2 px-2 w-[40px] font-semibold text-slate-600 text-xs">{t("tableNo")}</th>
                                                <th className="text-left py-2 px-2 w-[200px] font-semibold text-slate-600 text-xs">{t("tableItemName")}</th>
                                                <th className="text-left py-2 px-2 w-[115px] font-semibold text-slate-600 text-xs">{t("tableItemCode")}</th>
                                                <th className="text-left py-2 px-2 w-[90px] font-semibold text-slate-600 text-xs">{t("tableBarcode")}</th>
                                                <th className="text-right py-2 px-2 w-[70px] font-semibold text-slate-600 text-xs">{t("tableQty")}</th>
                                                <th className="text-right py-2 px-2 w-[100px] font-semibold text-slate-600 text-xs">{t("tablePrice")}</th>
                                                <th className="text-right py-2 px-2 w-[100px] font-semibold text-slate-600 text-xs">{t("tableAmount")}</th>
                                                <th className="text-center py-2 px-1 w-[55px] font-semibold text-slate-600 text-xs">{t("tableVatPercent")}</th>
                                                <th className="text-right py-2 px-2 w-[95px] font-semibold text-slate-600 text-xs">{t("tableVatAmount")}</th>
                                                <th className="text-right py-2 px-2 w-[110px] font-semibold text-slate-600 text-xs">{t("tableTotal")}</th>
                                                <th className="w-[40px]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {fields.map((field, index) => {
                                                const item = watchedItems?.[index]
                                                const itemSubtotal = (item?.quantity || 0) * (item?.price || 0)
                                                const itemVatAmount = itemSubtotal * ((item?.vatRate || 12) / 100)
                                                const itemTotalWithVat = itemSubtotal + itemVatAmount

                                                return (
                                                    <tr key={field.id} className="group hover:bg-slate-50/30 transition-colors">
                                                        {/* No */}
                                                        <td className="py-2 px-2 w-[40px] text-slate-500 text-xs">
                                                            {index + 1}
                                                        </td>

                                                        {/* Item Name */}
                                                        <td className="py-2 px-2 w-[200px]">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.productId`}
                                                                render={({ field }) => (
                                                                    <Select
                                                                        onValueChange={(val) => {
                                                                            field.onChange(val)
                                                                            const p = products.find(p => p.id === val)
                                                                            if (p) {
                                                                                form.setValue(`items.${index}.productName`, p.name)
                                                                                form.setValue(`items.${index}.price`, p.currentPrice)
                                                                                form.setValue(`items.${index}.vatRate`, p.vatRate)
                                                                                form.setValue(`items.${index}.sapCode`, p.sapCode || '')
                                                                                form.setValue(`items.${index}.barcode`, p.barcode || '')
                                                                                form.setValue(`items.${index}.hasCustomPrice`, p.hasCustomerPrice)
                                                                            }
                                                                        }}
                                                                        defaultValue={field.value}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100 transition-colors p-0 shadow-none focus:ring-0 text-xs truncate">
                                                                                <SelectValue placeholder={t("selectProductPlaceholder")} />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {products.map(p => (
                                                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </td>

                                                        {/* Item Code (SAP Code) */}
                                                        <td className="py-2 px-2 w-[115px]">
                                                            <span className="text-xs font-mono text-slate-600 truncate block">
                                                                {item?.sapCode || '—'}
                                                            </span>
                                                        </td>

                                                        {/* Barcode */}
                                                        <td className="py-2 px-2 w-[90px]">
                                                            <span className="text-xs font-mono text-slate-600 truncate block">
                                                                {item?.barcode || '—'}
                                                            </span>
                                                        </td>

                                                        {/* Qty */}
                                                        <td className="py-2 px-2 w-[70px]">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.quantity`}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        type="number"
                                                                        step="1"
                                                                        min="1"
                                                                        className="h-8 text-right font-mono border-none bg-transparent hover:bg-slate-100 transition-colors focus:ring-0 tabular-nums text-xs"
                                                                        {...field}
                                                                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                                    />
                                                                )}
                                                            />
                                                        </td>

                                                        {/* Price */}
                                                        <td className="py-2 px-2 w-[100px] text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {item?.hasCustomPrice && (
                                                                    <span className="text-sky-600 text-xs" title="Custom price">💎</span>
                                                                )}
                                                                <span className="font-mono font-semibold tabular-nums text-slate-900 text-xs">
                                                                    {(item?.price || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Amount (Subtotal) */}
                                                        <td className="py-2 px-2 w-[100px] text-right">
                                                            <span className="font-mono font-bold tabular-nums text-slate-900 text-xs">
                                                                {itemSubtotal.toLocaleString()}
                                                            </span>
                                                        </td>

                                                        {/* VAT Rate */}
                                                        <td className="py-2 px-1 w-[55px] text-center">
                                                            <span className="text-xs font-medium text-slate-600">
                                                                {item?.vatRate || 12}%
                                                            </span>
                                                        </td>

                                                        {/* VAT Amount */}
                                                        <td className="py-2 px-2 w-[95px] text-right">
                                                            <span className="font-mono text-amber-700 tabular-nums text-xs">
                                                                {itemVatAmount.toLocaleString()}
                                                            </span>
                                                        </td>

                                                        {/* Total with VAT */}
                                                        <td className="py-2 px-2 w-[110px] text-right">
                                                            <span className="font-mono font-bold text-sky-700 tabular-nums text-xs">
                                                                {itemTotalWithVat.toLocaleString()}
                                                            </span>
                                                        </td>

                                                        {/* Delete */}
                                                        <td className="py-2 px-1 w-[40px] text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => remove(index)}
                                                                disabled={fields.length === 1}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        {/* Totals Row */}
                                        <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                                            <tr>
                                                {/* No column */}
                                                <td className="py-3 px-2 w-[40px]"></td>

                                                {/* Item Name through Barcode - "TOTAL" label */}
                                                <td className="py-3 px-2 w-[200px]" colSpan={3}>
                                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                                        {t("totalLabel")}
                                                    </span>
                                                </td>

                                                {/* Qty column - empty */}
                                                <td className="py-3 px-2 w-[70px]"></td>

                                                {/* Price column - empty */}
                                                <td className="py-3 px-2 w-[100px]"></td>

                                                {/* Amount (Subtotal) column */}
                                                <td className="py-3 px-2 w-[100px] text-right">
                                                    <div className="space-y-0.5">
                                                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                            {t("netLabel")}
                                                        </div>
                                                        <div className="font-mono font-black text-slate-900 tabular-nums text-sm">
                                                            {subtotal.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* VAT % column - empty (no need to show 12%) */}
                                                <td className="py-3 px-1 w-[55px] text-center"></td>

                                                {/* VAT Amount column */}
                                                <td className="py-3 px-2 w-[95px] text-right">
                                                    <div className="space-y-0.5">
                                                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                            {t("vatLabel")}
                                                        </div>
                                                        <div className="font-mono font-black text-amber-700 tabular-nums text-sm">
                                                            {totalVatAmount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Total with VAT column */}
                                                <td className="py-3 px-2 w-[110px] text-right">
                                                    <div className="space-y-0.5">
                                                        <div className="text-[9px] font-bold uppercase tracking-wider text-sky-500">
                                                            {t("totalWithVatLabel")}
                                                        </div>
                                                        <div className="font-mono font-black text-sky-700 tabular-nums text-base">
                                                            {totalAmount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Delete column */}
                                                <td className="py-3 px-1 w-[40px]"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                    {fields.length === 0 && (
                                        <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                                            <Plus className="h-8 w-8 opacity-20" />
                                            <p>{t("noProductsText")}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-500 text-xs">{t("notesLabel")}</FormLabel>
                                        <FormControl>
                                            <textarea
                                                className="flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                                                placeholder={t("notesPlaceholder")}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </ScrollArea>

                {/* Action Footer */}
                <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] shrink-0">
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10 px-4 text-slate-500 hover:text-slate-900 border-none">
                            {t("cancelButton")}
                        </Button>
                        <Button
                            type="submit"
                            onClick={form.handleSubmit(onSubmit)}
                            className="h-10 px-8 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-[0.98] min-w-[140px] gap-2"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Calculator className="h-4 w-4" />
                            )}
                            {isEdit ? t("updateButton") : t("finalizeButton")}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
