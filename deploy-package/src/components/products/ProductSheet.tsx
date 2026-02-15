"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Package,
  DollarSign,
  Barcode,
  Calculator,
  Info,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { productSchema, type ProductFormValues } from "@/lib/validations/product"

interface Product {
  id: string
  name: string
  sapCode?: string | null
  barcode?: string | null
  sku?: string | null
  unitPrice: number
  unit: string
  vatRate: number
  description?: string | null
  isActive: boolean
}

interface ProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Product | null
  onSave: (data: ProductFormValues) => Promise<void>
  mode: 'create' | 'edit' | 'view'
}

const UNIT_OPTIONS = [
  { value: 'ШТ', label: 'Штука (ШТ)' },
  { value: 'КГ', label: 'Килограмм (КГ)' },
  { value: 'Л', label: 'Литр (Л)' },
  { value: 'М', label: 'Метр (М)' },
  { value: 'УП', label: 'Упаковка (УП)' },
  { value: 'Я', label: 'Ящик (Я)' },
]

export function ProductSheet({
  open,
  onOpenChange,
  initialData,
  onSave,
  mode,
}: ProductSheetProps) {
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const isCreate = mode === 'create'

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      sapCode: '',
      barcode: '',
      sku: '',
      unitPrice: 0,
      unit: 'ШТ',
      vatRate: 12,
      description: '',
    },
  })

  // Watch fields for live price calculation
  const watchUnitPrice = form.watch('unitPrice')
  const watchVatRate = form.watch('vatRate') || 12
  const priceWithVat = watchUnitPrice * (1 + watchVatRate / 100)

  // Reset form when initialData changes or sheet opens
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          sapCode: initialData.sapCode || '',
          barcode: initialData.barcode || '',
          sku: initialData.sku || '',
          unitPrice: initialData.unitPrice,
          unit: initialData.unit,
          vatRate: initialData.vatRate,
          description: initialData.description || '',
        })
      } else {
        form.reset({
          name: '',
          sapCode: '',
          barcode: '',
          sku: '',
          unitPrice: 0,
          unit: 'ШТ',
          vatRate: 12,
          description: '',
        })
      }
    }
  }, [initialData, form, open])

  const onSubmit = async (data: ProductFormValues) => {
    try {
      await onSave(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[50vw] flex flex-col p-0 h-full border-l border-slate-200">
        {/* Sticky Header */}
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <SheetHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 shadow-sm shadow-sky-50">
                  <Package className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "py-1",
                    isView && "text-slate-700 bg-slate-50 border-slate-100",
                    isEdit && "text-amber-700 bg-amber-50 border-amber-100",
                    isCreate && "text-sky-700 bg-sky-50 border-sky-100"
                  )}
                >
                  {isView && "Read-Only View"}
                  {isEdit && "Edit Mode"}
                  {isCreate && "Create New"}
                </Badge>
              </div>
            </div>
            <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight">
              {isView && `Product: ${initialData?.name || ''}`}
              {isEdit && `Edit: ${initialData?.name || ''}`}
              {isCreate && "New Product Entry"}
            </SheetTitle>
            <SheetDescription className="text-slate-500">
              {isView && "View product details and pricing information"}
              {isEdit && "Modify product information and pricing"}
              {isCreate && "Create a new product with complete information"}
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 bg-slate-50/30">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Info className="h-4 w-4 text-sky-500" />
                  Basic Information
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-900">
                        Product Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isView}
                          placeholder="e.g., Лёд пищевой Ever Cold 3кг"
                          className={cn(
                            "h-11 bg-slate-50 border-slate-200 hover:bg-white transition-all",
                            isView && "cursor-not-allowed opacity-70"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-900">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={isView}
                          placeholder="Product description (optional)"
                          className={cn(
                            "min-h-[80px] bg-slate-50 border-slate-200 hover:bg-white transition-all resize-none",
                            isView && "cursor-not-allowed opacity-70"
                          )}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-500">
                        Max 1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-900">
                        Unit of Measurement <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isView}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              "h-11 bg-slate-50 border-slate-200 hover:bg-white transition-colors",
                              isView && "cursor-not-allowed opacity-70"
                            )}
                          >
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIT_OPTIONS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <DollarSign className="h-4 w-4 text-sky-500" />
                  Pricing Information
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-900">
                          Unit Price (without VAT) <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            disabled={isView}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={cn(
                              "h-11 bg-slate-50 border-slate-200 hover:bg-white transition-all text-right font-mono",
                              isView && "cursor-not-allowed opacity-70"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500">
                          Price per unit in UZS
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-900">
                          VAT Rate (%) <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            disabled={isView}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            placeholder="12"
                            className={cn(
                              "h-11 bg-slate-50 border-slate-200 hover:bg-white transition-all text-right font-mono",
                              isView && "cursor-not-allowed opacity-70"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500">
                          Default: 12%
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Price Calculation Preview */}
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-sky-600" />
                      <span className="text-sm font-semibold text-sky-900">
                        Calculated Price (with VAT)
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-sky-700 tabular-nums">
                        {priceWithVat.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-sky-600 font-medium">UZS</p>
                    </div>
                  </div>
                  <p className="text-xs text-sky-700 mt-2">
                    Formula: {watchUnitPrice.toLocaleString()} × (1 + {watchVatRate}%) = {priceWithVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} сўм
                  </p>
                </div>
              </div>

              {/* Product Codes Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Barcode className="h-4 w-4 text-sky-500" />
                  Product Identification Codes
                </div>

                <FormField
                  control={form.control}
                  name="sapCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-900">
                        SAP Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isView}
                          placeholder="e.g., 107000001-00001"
                          className={cn(
                            "h-11 bg-slate-50 border-slate-200 hover:bg-white transition-all font-mono",
                            isView && "cursor-not-allowed opacity-70"
                          )}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-500">
                        Unique SAP system code (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-900">
                          Barcode
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isView}
                            placeholder="e.g., 8801234567890"
                            className={cn(
                              "h-11 bg-slate-50 border-slate-200 hover:bg-white transition-all font-mono",
                              isView && "cursor-not-allowed opacity-70"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500">
                          Product barcode (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-900">
                          SKU
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isView}
                            placeholder="e.g., ICE-3KG"
                            className={cn(
                              "h-11 bg-slate-50 border-slate-200 hover:bg-white transition-all font-mono",
                              isView && "cursor-not-allowed opacity-70"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500">
                          Stock Keeping Unit (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> All product codes must be unique if provided. Leave empty if not applicable.
                  </p>
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-slate-200 bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Price Summary */}
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Unit Price
                </span>
                <p className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                  {watchUnitPrice.toLocaleString()} <span className="text-xs">UZS</span>
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                  With VAT
                </span>
                <p className="text-lg font-mono font-bold text-sky-600 tabular-nums">
                  {priceWithVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">UZS</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-12 px-6 text-slate-500 hover:text-slate-900 border-none"
              >
                {isView ? 'Close' : 'Cancel'}
              </Button>
              {!isView && (
                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  className="h-12 px-10 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-[0.98] min-w-[160px] gap-2"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  {isEdit ? 'Update Product' : 'Create Product'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
