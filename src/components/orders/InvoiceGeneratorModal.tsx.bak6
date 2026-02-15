"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calculator, Calendar as CalendarIcon, FileText, Check } from "lucide-react"
import { formatDate, toInputDateValue } from "@/lib/date-utils"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
interface InvoiceGeneratorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedOrders: any[]
}

export function InvoiceGeneratorModal({ open, onOpenChange, selectedOrders }: InvoiceGeneratorModalProps) {
    const [contract, setContract] = React.useState("")
    const [invoiceDate, setInvoiceDate] = React.useState(toInputDateValue(new Date()))

    // Mock calculation logic for Uzbek VAT (12%)
    const VAT_RATE = 0.12

    const totals = React.useMemo(() => {
        const totalAmount = selectedOrders.reduce((acc, order) => acc + order.amount, 0)
        const totalWeight = selectedOrders.reduce((acc, order) => acc + order.weight, 0)

        // Reverse calculation assuming amount includes VAT or adds VAT depending on business logic
        // Usually B2B prices are ex-VAT or incl-VAT. Let's assume Order Amount is incl. VAT for simplicity in display,
        // but often Invoices explicitly show the breakdown. 
        // Let's assume the stored amount is GRAND TOTAL (Gross).

        const grossTotal = totalAmount
        const netTotal = grossTotal / (1 + VAT_RATE)
        const vatTotal = grossTotal - netTotal

        return {
            gross: grossTotal,
            net: netTotal,
            vat: vatTotal,
            weight: totalWeight
        }
    }, [selectedOrders])

    const handleGenerate = () => {
        // Logic to actually generate/download PDF or save invoice record would go here
        console.log("Generating Invoice for", selectedOrders.length, "orders")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-sky-600" />
                        Создать счет-фактуру
                    </DialogTitle>
                    <DialogDescription>
                        Будет создан документ счет-фактура на выбранные заказы
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Договор</Label>
                            <Select value={contract} onValueChange={setContract}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите договор..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="KOR-2024">KOR-2024 (Main)</SelectItem>
                                    <SelectItem value="KOR-SUP-1">KOR-SUP-1 (Supplementary)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Дата счета</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-slate-900 flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-slate-500" />
                            Summary Calculation
                        </h4>

                        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm border border-slate-100">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Selected Orders</span>
                                <span className="font-medium">{selectedOrders.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Weight</span>
                                <span className="font-medium font-mono">{totals.weight.toLocaleString()} kg</span>
                            </div>
                            <div className="h-px bg-slate-200 my-1" />
                            <div className="flex justify-between">
                                <span className="text-slate-500">Сумма без НДС</span>
                                <span className="font-medium font-mono">{totals.net.toLocaleString(undefined, { maximumFractionDigits: 2 })} UZS</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>НДС (12%)</span>
                                <span className="font-medium font-mono">{totals.vat.toLocaleString(undefined, { maximumFractionDigits: 2 })} UZS</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200">
                                <span className="font-bold text-slate-900">Сумма к оплате</span>
                                <span className="font-bold text-sky-700 font-mono text-lg">{totals.gross.toLocaleString()} UZS</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-sky-50 text-sky-800 text-xs p-3 rounded-md flex gap-2">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                            This will generate a legal Schet-Faktura document compliant with Uzbekistan Tax Code (Art. 47).
                            The document will be available in the "Finance" section.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
                    <Button onClick={handleGenerate} className="bg-sky-600 hover:bg-sky-700">Создать счет-фактуру</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
